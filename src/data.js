export const PROFILE = {
  name: 'Gyanaranjan Panda',
  initials: 'GP',
  title: 'Java Full Stack Engineer',
  company: 'Boeing',
  location: 'India · Hybrid',
  years: '4.5',
  available: 'Open to work · Java Full Stack + AWS',
  tagline: 'Java on the backend. React on the front.',
  taglineAccent: 'Cloud underneath.',
  summary:
    'Software Engineer at Boeing, four and a half years into building the backend half properly ' +
    'and the front-end half so it does the backend justice — Spring Boot microservices, Kafka ' +
    'event pipelines and React interfaces, deployed on AWS and GCP and built to hold up once ' +
    'real traffic arrives.',
};

/** Availability banner shown on the home page and on /contact. */
export const OPEN_TO_WORK = {
  status: 'Open to work',
  role: 'Software Engineer',
  focus: 'Java Full Stack + AWS',
  note:
    'Looking for backend-heavy full-stack work — Spring Boot services, event-driven systems ' +
    'and the cloud infrastructure they run on.',
  facts: [
    ['Focus', 'Backend & distributed systems'],
    ['Stack', 'Java · Spring Boot · AWS'],
    ['Base', 'India · Hybrid or remote'],
    ['Reply', 'Usually within a day'],
  ],
};

export const METRICS = [
  { k: '4.5', v: 'Years shipping' },
  { k: '4', v: 'Engineering roles' },
  { k: '10+', v: 'Microservices built' },
  { k: '2', v: 'Flagship platforms' },
];

export const EXPERIENCE = [
  {
    id: 'boeing',
    org: 'Boeing',
    role: 'Software Engineer',
    when: 'Feb 2026 → present',
    place: 'India · Hybrid',
    current: true,
    bullets: [
      'Backend services and distributed systems in Java and Spring Boot.',
      'Working across service boundaries where correctness and traceability matter more than raw throughput.',
    ],
    tags: ['Java', 'Spring Boot', 'Microservices', 'Distributed Systems'],
  },
  {
    id: 'curebay',
    org: 'CureBay',
    role: 'Software Engineer — Mid',
    when: 'Jun 2024 → Nov 2025 · 1y 6m',
    place: 'Bhubaneswar · Hybrid',
    bullets: [
      'Designed and shipped event-driven microservices on Apache Kafka — ordering, catalog, prescription and consultation flows.',
      'Owned authentication and authorisation end to end: Spring Security, JWT and Keycloak across every internal service.',
      'Delivered REST APIs to GCP through Docker-based CI/CD, from branch to production.',
      'Profiled and fixed production issues — slow queries, hot endpoints, retry storms — rather than throwing instances at them.',
    ],
    tags: ['Java', 'Spring Boot', 'Kafka', 'GCP', 'JWT', 'Keycloak', 'Docker'],
  },
  {
    id: 'certiview',
    org: 'Certiview IT & Management Solutions',
    role: 'Java Developer',
    when: 'Jan 2022 → May 2024 · 2y 5m',
    place: 'Bengaluru · Hybrid',
    bullets: [
      'Java application development across the full request lifecycle — controller to persistence.',
      'MEAN-stack work alongside the Java services, which is where the full-stack half started.',
    ],
    tags: ['Java', 'MEAN Stack', 'REST APIs', 'MongoDB'],
  },
  {
    id: 'tapacademy',
    org: 'TapAcademy',
    role: 'Associate Software Developer',
    when: 'Apr → Nov 2021 · 8m',
    place: 'Bengaluru · On-site · Internship',
    bullets: ['Server-side programming in Java — the first production code I was responsible for.'],
    tags: ['Java', 'Server-Side'],
  },
];

export const PROJECTS = [
  {
    name: 'Connect Application',
    sub: 'B2B Pharmacy & Healthcare Platform · CureBay',
    role: 'Full Stack Java Developer',
    domain: 'Healthcare e-commerce · Doctor consultation · OCR prescriptions · Bulk ordering',
    summary:
      'A multi-tenant B2B platform where pharmacies order stock, patients book consultations, and ' +
      'prescriptions arrive as scanned images that have to become structured orders.',
    bullets: [
      'Built ERP integrations and a Security Manager module governing access across business operations.',
      'Split the domain into Spring Boot microservices — medicine ordering, catalog/cart, prescription processing, bulk orders and consultation workflows — each owning its own data.',
      'Built REST APIs on Spring MVC with a strict layered contract: request validation, structured logging and centralised exception handling at every boundary.',
      'Tuned database access with Spring Data JPA and Hibernate — projections, pagination and query rewrites for the high-volume catalog paths.',
      'Drove delivery with UI, QA and Product, taking features from spec to production readiness.',
    ],
    tags: ['Java', 'Spring Boot', 'Angular', 'GCP', 'Spring Data JPA', 'MySQL', 'MongoDB', 'Microservices', 'Hexagonal Architecture'],
  },
  {
    name: 'FDS — Financial Document Store',
    sub: 'Financial Document Management System',
    role: 'Java Developer',
    domain: 'Documents for deals, transactions, companies and facilities',
    summary:
      'A document system for regulated financial workflows, where every read and write is an ' +
      'auditable event and duplicate processing is a compliance problem, not a bug report.',
    bullets: [
      'Developed microservices with Spring Boot, Spring MVC and Spring Data JPA over PostgreSQL.',
      'Wired service-to-service calls with @FeignClient and RestTemplate; moved the slow paths onto Apache Kafka for asynchronous processing.',
      'Built the Fax Module — fetch, update, delete, split and merge operations over document workflows.',
      'Added batch processing with scheduler locks so a job runs exactly once across distributed instances instead of once per instance.',
      'Introduced indexing and search to keep retrieval fast at volume, plus a permalink generator for secure external document sharing.',
      'Enforced authentication and authorisation over sensitive financial documents, and hardened fault tolerance on the integration paths.',
    ],
    tags: ['Java', 'Spring Boot', 'Apache Kafka', 'PostgreSQL', 'Feign Client', 'Spring Data JPA', 'Microservices', 'Maven'],
  },
];

export const STACK = [
  ['Languages', ['Java', 'JavaScript', 'SQL']],
  ['Backend', ['Spring Boot', 'Spring MVC', 'Spring Security', 'JPA / Hibernate', 'REST APIs']],
  ['Front-end', ['React', 'Angular', 'Responsive UI']],
  ['Messaging', ['Apache Kafka', 'Google Pub/Sub']],
  ['Data', ['PostgreSQL', 'MySQL', 'MongoDB']],
  ['Auth', ['JWT', 'OAuth 2.0', 'Keycloak', 'Spring Security']],
  ['Cloud & Ops', ['GCP', 'AWS', 'Docker', 'CI/CD', 'Maven']],
  ['Practices', ['Microservices', 'Event-driven design', 'Hexagonal architecture']],
];

/**
 * Cards the hero types out, one after another, then erases.
 *
 * Keep them within ~16 lines and ~72 columns — the panel height is fixed to the
 * tallest so the layout never shifts mid-cycle, and long lines force a
 * horizontal scrollbar that looks broken while typing.
 */
export const HERO_SNIPPETS = [
  {
    label: 'Java',
    lang: 'java',
    file: 'Order.java',
    code: `public final class Order {

  private final OrderId id;
  private OrderStatus status;
  private Instant cancelledAt;

  public void cancel(Clock clock) {
    if (status == OrderStatus.SHIPPED) {
      throw new OrderAlreadyShipped(id);
    }
    if (status == OrderStatus.CANCELLED) {
      return;  // cancelling twice is not an error
    }
    status = OrderStatus.CANCELLED;
    cancelledAt = clock.instant();
  }
}`,
  },
  {
    label: 'Spring Boot',
    lang: 'java',
    file: 'OrderController.java',
    code: `@RestController
@RequestMapping("/api/v1/orders")
class OrderController {

  private final OrderService orders;

  @PostMapping
  @PreAuthorize("hasAuthority('SCOPE_order:write')")
  ResponseEntity<OrderView> place(
      @Valid @RequestBody PlaceOrder cmd,
      @RequestHeader("Idempotency-Key") String key) {

    // same key, same result — retries are free
    Order order = orders.place(cmd, key);
    return ResponseEntity.ok(OrderView.from(order));
  }
}`,
  },
  {
    label: 'SQL',
    lang: 'sql',
    file: 'top_customers.sql',
    code: `SELECT c.id,
       c.name,
       COUNT(o.id)        AS orders,
       SUM(o.total_minor) AS lifetime_minor
FROM   customer c
JOIN   orders   o ON o.customer_id = c.id
WHERE  o.placed_at >= NOW() - INTERVAL '90 days'
  AND  o.status = 'FULFILLED'
GROUP  BY c.id, c.name
HAVING COUNT(o.id) > 3
ORDER  BY lifetime_minor DESC
LIMIT  20;`,
  },
  {
    label: 'React',
    lang: 'jsx',
    file: 'useOrders.js',
    code: `export function useOrders(status) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    const ac = new AbortController();
    const opts = { signal: ac.signal };

    fetch(\`/api/orders?status=\${status}\`, opts)
      .then((r) => r.json())
      .then((data) => setState({ loading: false, data }))
      .catch((e) => setState({ error: e }));

    return () => ac.abort();
  }, [status]);

  return state;
}`,
  },
  {
    label: 'AWS',
    lang: 'java',
    file: 'OrderQueueListener.java',
    code: `@Component
class OrderQueueListener {

  private final ProcessedEvents processed;
  private final OrderService orders;

  @SqsListener("order-events")
  void onOrderEvent(OrderEvent event,
                    @Header("MessageId") String id) {

    // SQS delivers at least once — claim before applying
    if (!processed.claim(id)) {
      return;
    }
    orders.apply(event);
  }
}`,
  },
];

export const LINKS = {
  github: 'https://github.com/grpanda16',
  linkedin: 'https://www.linkedin.com/in/gyana16/',
  email: 'gr.panda16@gmail.com',
  resume: '/resume.pdf',
};
