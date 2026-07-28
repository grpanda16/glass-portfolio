import Code from '../components/Code';

export const meta = {
  title: 'Idempotent Kafka Consumers: Exactly-Once in Practice',
  date: '2026-03-21',
  read: '10 min',
  tags: ['Kafka', 'Distributed Systems', 'Spring Boot'],
  blurb:
    'Kafka gives you at-least-once by default, which means duplicates are not an edge case — they ' +
    'are the contract. How to build consumers that can be redelivered the same message twice and ' +
    'not charge anyone twice.',
};

export default function Post() {
  return (
    <>
      <p>
        A charge went out twice. The logs showed one payment event published, and two{' '}
        <code>PaymentCaptured</code> records written. Nothing had crashed, nothing had been retried
        by a human, and the code had no loop in it.
      </p>
      <p>
        What happened was a consumer group rebalance. The consumer processed the record, then took
        slightly too long to commit its offset, the broker decided it was dead and reassigned the
        partition — and the new owner started from the last committed offset, which was before that
        record.
      </p>
      <p>
        This is not a bug in Kafka. It is Kafka behaving exactly as documented.{' '}
        <strong>At-least-once delivery means duplicates are part of the contract</strong>, and the
        consumer is where that gets handled.
      </p>

      <h2>Why at-least-once is the default</h2>
      <p>Processing a record is two separate actions, and they cannot be made atomic for free:</p>
      <ol>
        <li>Do the work — write a row, call a service, send an email.</li>
        <li>Commit the offset saying &quot;I am done with this record.&quot;</li>
      </ol>
      <p>Whichever order you pick, a crash in between costs you something:</p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Order</th><th>Crash in between</th><th>Guarantee</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Work, then commit</td>
              <td>Work done, offset not moved → redelivered</td>
              <td><strong>At-least-once</strong> (duplicates)</td>
            </tr>
            <tr>
              <td>Commit, then work</td>
              <td>Offset moved, work never happened → skipped</td>
              <td><strong>At-most-once</strong> (data loss)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Given the choice between duplicates and silent data loss, duplicates win every time — a
        duplicate is recoverable, a lost payment is not. So the default is at-least-once, and{' '}
        <em>your handler has to be safe to run twice.</em>
      </p>

      <div className="note bad">
        <span className="nt">The auto-commit trap</span>
        <code>enable.auto.commit=true</code> commits on a timer, unrelated to whether your handler
        succeeded. It can commit a record you have not finished processing — turning at-least-once
        into at-most-once without telling you. Spring Kafka disables it by default. Leave it off.
      </div>

      <h2>Idempotency beats coordination</h2>
      <p>
        The instinct is to reach for exactly-once semantics and transactions. Usually you do not
        need them. If processing the same record twice produces the same end state, duplicates stop
        mattering and the whole problem dissolves.
      </p>
      <p>
        The cheapest version: give every event a stable ID and record the ones you have seen. The{' '}
        <em>unique constraint does the work</em> — no locks, no read-then-write race.
      </p>

      <Code lang="java" name="ProcessedEvent.java">{`@Entity
@Table(name = "processed_event")
public class ProcessedEvent {

  @Id
  @Column(name = "event_id", length = 64)
  private String eventId;          // from the producer, not generated here

  @Column(nullable = false)
  private String consumerGroup;    // same event, different consumers

  @Column(nullable = false)
  private Instant processedAt;
}`}</Code>

      <Code lang="java" name="PaymentConsumer.java">{`@Component
@RequiredArgsConstructor
public class PaymentConsumer {

  private final ProcessedEventRepository processed;
  private final PaymentService payments;

  @KafkaListener(topics = "payments.captured", groupId = "billing")
  @Transactional
  public void onPaymentCaptured(
      @Payload PaymentCaptured event,
      @Header(KafkaHeaders.RECEIVED_KEY) String key) {

    // Claim the event first. The PK constraint is the concurrency control:
    // two consumers racing on the same event, exactly one wins.
    try {
      processed.saveAndFlush(ProcessedEvent.of(event.eventId(), "billing"));
    } catch (DataIntegrityViolationException duplicate) {
      log.debug("event {} already processed, skipping", event.eventId());
      return;
    }

    // Same transaction: either both the claim and the work commit, or neither.
    payments.capture(event.orderId(), event.amount());
  }
}`}</Code>

      <p>
        The claim and the work share one database transaction. If <code>capture</code> throws,
        the claim rolls back too, so redelivery genuinely retries rather than being swallowed as a
        duplicate. Getting that ordering wrong is how events get silently dropped.
      </p>

      <div className="note">
        <span className="nt">Keep the table bounded</span>
        <code>processed_event</code> grows forever unless you prune it. A nightly job deleting rows
        older than your maximum retention — comfortably longer than the topic&apos;s — keeps it
        small. Index on <code>processed_at</code> so the delete is cheap.
      </div>

      <h3>Better still: make the write itself idempotent</h3>
      <p>
        When the domain allows it, skip the bookkeeping entirely. An upsert keyed on something
        stable is naturally safe to repeat:
      </p>

      <Code lang="java" name="Naturally idempotent write">{`@Modifying
@Query("""
    INSERT INTO order_status (order_id, status, updated_at, version)
    VALUES (:orderId, :status, :at, :version)
    ON CONFLICT (order_id) DO UPDATE
      SET status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at,
          version = EXCLUDED.version
      WHERE order_status.version < EXCLUDED.version
    """)
void applyStatus(UUID orderId, String status, Instant at, long version);`}</Code>

      <p>
        The <code>version</code> guard handles the harder half of the problem:{' '}
        <strong>out-of-order delivery.</strong> Kafka only orders records within a partition, so if
        related events land on different partitions, a stale update can arrive after a newer one.
        Comparing versions makes a late event a no-op instead of a regression.
      </p>
      <p>
        Which is also the argument for choosing partition keys deliberately. Key by{' '}
        <code>orderId</code> and every event for one order lands on one partition, in order.
      </p>

      <h2>Retries and the dead letter topic</h2>
      <p>
        Not every failure deserves a retry. A malformed payload will fail identically forever, and
        retrying it blocks the partition behind it — one bad record stalls every consumer on that
        partition. Separate the two cases explicitly.
      </p>

      <Code lang="java" name="KafkaErrorConfig.java">{`@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> template) {
  // exhausted retries -> payments.captured.DLT
  var recoverer = new DeadLetterPublishingRecoverer(template,
      (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition()));

  // 1s, 2s, 4s, 8s, 16s — capped, jittered by the framework
  var backoff = new ExponentialBackOffWithMaxRetries(5);
  backoff.setInitialInterval(1_000L);
  backoff.setMultiplier(2.0);
  backoff.setMaxInterval(16_000L);

  var handler = new DefaultErrorHandler(recoverer, backoff);

  // These will never succeed on retry. Straight to the DLT.
  handler.addNotRetryableExceptions(
      DeserializationException.class,
      MethodArgumentNotValidException.class,
      IllegalArgumentException.class);

  return handler;
}`}</Code>

      <p>
        Blocking retries hold the partition. For long backoffs, use{' '}
        <code>@RetryableTopic</code> instead — failed records go to a delayed retry topic and the
        main partition keeps moving. The trade-off is that you lose ordering for retried records,
        which is fine if your consumer is idempotent, and not fine if it is not.
      </p>

      <div className="note">
        <span className="nt">A DLT nobody reads is a data loss queue</span>
        Alert on DLT depth. Give yourself a replay path — a small endpoint that reads from the DLT
        and republishes to the main topic once the bug is fixed. Otherwise the DLT is where events
        go to be forgotten.
      </div>

      <h2>When you actually do need transactions</h2>
      <p>
        There is one case idempotency does not cover: <strong>consume-transform-produce</strong>,
        where you read from one topic and write to another. Without a transaction, you can publish
        downstream and then fail before committing the offset, so redelivery publishes again — and
        this time the duplicate is in a topic other services already consumed.
      </p>

      <Code lang="yaml" name="application.yml">{`spring:
  kafka:
    producer:
      transaction-id-prefix: billing-tx-
      acks: all
      enable-idempotence: true
    consumer:
      isolation-level: read_committed   # never see uncommitted records`}</Code>

      <Code lang="java" name="Transactional forward">{`@KafkaListener(topics = "orders.placed", groupId = "billing")
@Transactional("kafkaTransactionManager")
public void onOrderPlaced(OrderPlaced event) {
  Invoice invoice = invoices.create(event);
  // the send and the offset commit land in one Kafka transaction
  template.send("invoices.created", invoice.orderId().toString(), InvoiceCreated.from(invoice));
}`}</Code>

      <p>
        Note what this does <em>not</em> cover: your database. A Kafka transaction is atomic across
        Kafka only. Mixing a database write and a Kafka publish in one unit of work is the classic
        dual-write problem, and the real answer there is the transactional outbox pattern — write
        the event to an outbox table in the same database transaction, and publish it from there.
      </p>
      <p>
        Exactly-once also costs throughput and adds coordinator failure modes. Reach for it when the
        semantics require it, not by default.
      </p>

      <div className="note good">
        <span className="nt">The short version</span>
        Assume every message arrives twice, because eventually it will. Claim events by ID under a
        unique constraint, or make the write an upsert with a version guard. Key by entity so
        related events stay ordered. Route non-retryable failures straight to a DLT — and then
        actually watch it.
      </div>
    </>
  );
}
