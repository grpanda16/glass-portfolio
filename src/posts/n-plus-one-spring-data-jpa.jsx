import Code from '../components/Code';

export const meta = {
  title: 'Killing the N+1 Query in Spring Data JPA',
  date: '2026-02-08',
  read: '9 min',
  tags: ['JPA', 'Hibernate', 'Performance', 'PostgreSQL'],
  blurb:
    'The endpoint that ran fine with twenty rows and fell over with two thousand. How to find N+1 ' +
    'queries, the four ways to fix them, and why the obvious fix quietly breaks pagination.',
};

export default function Post() {
  return (
    <>
      <p>
        The catalog endpoint took 90 milliseconds in staging and timed out in production. Same code,
        same query, same indexes. The only difference was that staging had 20 products and
        production had 2,400.
      </p>
      <p>
        That shape — fine on small data, catastrophic on real data, no single slow query in the
        logs — is almost always <strong>N+1</strong>: one query to fetch the list, then one more per
        row to fetch something related. Twenty rows is 21 queries and nobody notices. Two thousand
        four hundred rows is 2,401 round trips.
      </p>

      <h2>Seeing it</h2>
      <p>
        You cannot fix what you cannot see, and Hibernate is silent about this by default. Turn on
        statistics in your development profile — <em>only</em> there, they are not free:
      </p>

      <Code lang="yaml" name="application-dev.yml">{`spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
        format_sql: true
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE   # the actual bound parameters`}</Code>

      <p>
        Now every request logs a statistics line. If <code>2401 statements</code> appears next to an
        endpoint returning one page of results, you have found it.
      </p>
      <p>
        Better still, fail the build. Assert query counts in your integration tests, so an N+1 is
        caught by CI instead of by production:
      </p>

      <Code lang="java" name="CatalogQueryCountTest.java">{`@Test
void listingProductsIssuesOneQuery() {
  Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
  stats.clear();

  catalogService.page(PageRequest.of(0, 50));

  // one for the rows, one for the count
  assertThat(stats.getPrepareStatementCount()).isEqualTo(2);
}`}</Code>

      <h2>Where it comes from</h2>
      <p>
        Here is the code that caused it. Nothing about it looks wrong, which is the problem —{' '}
        <code>@ManyToOne</code> is <code>EAGER</code> by default, and every eager association is an
        extra query per row unless Hibernate can join it.
      </p>

      <Code lang="java" name="Product.java — before">{`@Entity
public class Product {

  @Id
  private Long id;
  private String name;

  @ManyToOne              // defaults to FetchType.EAGER
  private Category category;

  @OneToMany(mappedBy = "product")
  private List<PriceTier> tiers;   // LAZY, but touched in the mapper
}`}</Code>

      <Code lang="java" name="The innocent-looking service">{`public Page<ProductView> page(Pageable pageable) {
  return repo.findAll(pageable)
             .map(ProductView::from);   // <- reads p.getCategory() and p.getTiers()
}`}</Code>

      <p>
        <code>findAll</code> issues one query. Then <code>ProductView::from</code> touches{' '}
        <code>category</code> and <code>tiers</code> on each row, and each touch is another SELECT.
        The mapper looks pure; it is issuing database traffic.
      </p>

      <div className="note bad">
        <span className="nt">Rule one</span>
        Make every association <code>LAZY</code>, including <code>@ManyToOne</code>. Then fetch what
        you need explicitly, per query. Eager associations are a decision made once in the entity
        for every query that will ever touch it — which is never the right granularity.
      </div>

      <h2>Fix 1 — a fetch join</h2>
      <p>The direct answer: tell the query what to bring back with it.</p>

      <Code lang="java" name="ProductRepository.java">{`@Query("""
    SELECT DISTINCT p FROM Product p
    LEFT JOIN FETCH p.category
    WHERE p.active = true
    """)
List<Product> findActiveWithCategory();`}</Code>

      <p>
        One query, categories included. Good for a single to-one association and a bounded result
        set — and it has a sharp edge worth knowing about before you reach for it on a paged
        endpoint.
      </p>

      <div className="note bad">
        <span className="nt">Fetch join + Pageable = disaster</span>
        Join-fetch a <em>collection</em> with a <code>Pageable</code> and Hibernate cannot
        paginate in SQL — one entity becomes many rows. It logs{' '}
        <code>HHH90003004: firstResult/maxResults specified with collection fetch; applying in
        memory</code> and then loads <strong>the entire table</strong> into heap to paginate there.
        That warning is an outage in waiting. Never ignore it.
      </div>

      <h2>Fix 2 — an entity graph</h2>
      <p>
        Entity graphs say what to fetch without writing the join, so one repository method can serve
        different fetch plans:
      </p>

      <Code lang="java" name="Entity graph">{`@EntityGraph(attributePaths = {"category", "brand"})
Page<Product> findByActiveTrue(Pageable pageable);`}</Code>

      <p>
        Same limitation applies: safe for to-one associations, dangerous the moment a collection is
        in the path alongside pagination.
      </p>

      <h2>Fix 3 — batch fetching, the one I reach for</h2>
      <p>
        This is the highest value-per-line change in the whole post, and most projects never enable
        it. Instead of eliminating the extra queries, Hibernate <em>batches</em> them: rather than
        50 single-row lookups, one <code>IN</code> query for 50 IDs.
      </p>

      <Code lang="yaml" name="application.yml">{`spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 50   # global, applies to every lazy association`}</Code>

      <p>
        N+1 becomes N/50 + 1. A 2,401-query request drops to about 49. No code change, no query
        rewrite, and critically <strong>it composes with pagination</strong> — the page query stays
        a real SQL <code>LIMIT</code>, and the associations are filled in afterwards in batches.
      </p>
      <p>
        For collections, pair it with <code>@BatchSize</code> where you want a different size than
        the default:
      </p>

      <Code lang="java" name="Product.java — after">{`@Entity
public class Product {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private Category category;

  @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
  @BatchSize(size = 30)
  private List<PriceTier> tiers;
}`}</Code>

      <h2>Fix 4 — stop loading entities you are not mutating</h2>
      <p>
        The best fix for a read-only endpoint is not to hydrate entities at all. A projection selects
        exactly the columns the response needs, skips the persistence context, and never triggers a
        lazy load because there is nothing lazy to trigger.
      </p>

      <Code lang="java" name="Interface projection">{`public interface ProductRow {
  Long getId();
  String getName();
  BigDecimal getPrice();
  String getCategoryName();   // resolved via the join below
}

@Query("""
    SELECT p.id AS id, p.name AS name, p.price AS price, c.name AS categoryName
    FROM Product p JOIN p.category c
    WHERE p.active = true
    """)
Page<ProductRow> findActiveRows(Pageable pageable);`}</Code>

      <p>
        This is usually several times faster than the entity version, and the gap widens with row
        count — less data over the wire, no dirty-checking, no first-level cache full of objects
        nobody will modify. For any list or search endpoint, reach for this first.
      </p>

      <div className="note good">
        <span className="nt">Also</span>
        Mark read paths <code>@Transactional(readOnly = true)</code>. Hibernate skips dirty checking
        and snapshot retention, and the driver can route to a replica. It is one annotation and it
        costs nothing.
      </div>

      <h2>Choosing between them</h2>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Situation</th><th>Use</th></tr>
          </thead>
          <tbody>
            <tr><td>Read-only list or search endpoint</td><td>Projection (fix 4)</td></tr>
            <tr><td>Paged results with lazy associations</td><td><code>default_batch_fetch_size</code> (fix 3)</td></tr>
            <tr><td>One to-one association, bounded set</td><td>Fetch join or entity graph</td></tr>
            <tr><td>Collections plus pagination</td><td>Batch fetching — never a collection fetch join</td></tr>
            <tr><td>Writing / mutating entities</td><td>Entities, fetched deliberately</td></tr>
          </tbody>
        </table>
      </div>

      <h2>The other one: unbounded pagination</h2>
      <p>
        While you are in there — <code>OFFSET</code> pagination degrades linearly. Page 1 with{' '}
        <code>LIMIT 20 OFFSET 0</code> is instant; page 5,000 with{' '}
        <code>OFFSET 100000</code> makes the database read and discard 100,000 rows first.
      </p>
      <p>
        For deep or infinite-scroll pagination, use a keyset (seek) instead. It stays constant-time
        because it is an index range scan:
      </p>

      <Code lang="java" name="Keyset pagination">{`@Query("""
    SELECT p FROM Product p
    WHERE p.active = true
      AND (p.createdAt, p.id) < (:lastCreatedAt, :lastId)
    ORDER BY p.createdAt DESC, p.id DESC
    """)
List<Product> nextPage(Instant lastCreatedAt, Long lastId, Limit limit);`}</Code>

      <p>
        The <code>id</code> tiebreaker matters: without it, rows sharing a timestamp can be skipped
        or repeated across pages.
      </p>

      <div className="note good">
        <span className="nt">The short version</span>
        Make everything lazy, set <code>default_batch_fetch_size</code> today, project instead of
        hydrating on read paths, and assert query counts in tests. If you see{' '}
        <code>applying in memory</code> in the logs, stop and fix it — that one is not a warning,
        it is a countdown.
      </div>
    </>
  );
}
