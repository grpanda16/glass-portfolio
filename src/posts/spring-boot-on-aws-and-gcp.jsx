import Code from '../components/Code';

export const meta = {
  title: 'Shipping the Same Spring Boot Service to AWS and GCP',
  date: '2026-07-22',
  read: '10 min',
  tags: ['AWS', 'GCP', 'Cloud', 'Spring Boot'],
  blurb:
    'The container is the portable part. Everything around it — queues, secrets, identity, ' +
    'database connections — is not. What actually differs between the two, and which ' +
    'differences are worth abstracting away.',
};

export default function Post() {
  return (
    <>
      <p>
        &quot;It&apos;s containerised, so it runs anywhere&quot; is true of the container and
        almost nothing else. The image moves. The queue it reads from, the secret it needs at
        startup, the identity it authenticates as, and the way it opens a database connection are
        all cloud-specific, and all of them are where the deployment actually goes wrong.
      </p>
      <p>
        Here is what I keep hitting when the same Spring Boot service has to run on both.
      </p>

      <h2>What is genuinely portable</h2>
      <p>
        One multi-stage build, one image, both clouds. This part really is boring, which is the
        point — spend your portability budget here and nowhere else.
      </p>

      <Code lang="bash" name="Dockerfile">{`FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:go-offline     # cached unless pom.xml changes
COPY src ./src
RUN ./mvnw -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]`}</Code>

      <div className="note">
        <span className="nt">Set MaxRAMPercentage</span>
        The JVM sizes its heap from what it believes the machine has. In a container with a hard
        memory limit, the default heuristic can leave too little headroom for everything outside
        the heap, and the platform kills the container rather than the JVM throwing
        <code> OutOfMemoryError</code>. You get a restart loop with no stack trace. Modern JVMs are
        container-aware, but the percentage is still worth setting explicitly.
      </div>

      <h2>Compute: Fargate against Cloud Run</h2>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th></th><th>AWS — ECS on Fargate</th><th>GCP — Cloud Run</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Model</strong></td>
              <td>Long-running tasks</td>
              <td>Request-driven, scales to zero</td>
            </tr>
            <tr>
              <td><strong>Idle cost</strong></td>
              <td>You pay for running tasks</td>
              <td>Nothing at zero traffic</td>
            </tr>
            <tr>
              <td><strong>Cold starts</strong></td>
              <td>Not really a factor</td>
              <td>Real, and JVMs are not fast to start</td>
            </tr>
            <tr>
              <td><strong>Background work</strong></td>
              <td>Fine — the task is always up</td>
              <td>Needs care; CPU is throttled outside a request</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        That last row is the one that bites. Cloud Run&apos;s default is to throttle CPU when no
        request is in flight, so <code>@Scheduled</code> jobs, Kafka consumers and async workers
        either crawl or stop. Either set the service to always allocate CPU, or — better — move the
        background work out to a job that runs on its own schedule.
      </p>
      <p>
        Cold starts are the other one. A Spring Boot service taking several seconds to come up is
        invisible on Fargate and painful on a scale-to-zero platform. Setting a minimum instance
        count fixes it and gives back the cost saving that made Cloud Run attractive, so decide
        which you actually wanted.
      </p>

      <h3>Lambda against Cloud Run</h3>
      <p>
        These get compared constantly, and they are not the same shape. Lambda is a function with a
        managed runtime around it; Cloud Run is your container, scaled to zero. The GCP equivalent
        of Lambda is Cloud Functions — but since Cloud Run is what people actually reach for, the
        comparison worth having is this one.
      </p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th></th><th>AWS Lambda</th><th>GCP Cloud Run</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Unit</strong></td>
              <td>A handler function</td>
              <td>A container listening on a port</td>
            </tr>
            <tr>
              <td><strong>Max duration</strong></td>
              <td>15 minutes, hard</td>
              <td>Configurable, and far longer</td>
            </tr>
            <tr>
              <td><strong>Concurrency</strong></td>
              <td>One request per instance</td>
              <td>Many per instance — the JVM gets used properly</td>
            </tr>
            <tr>
              <td><strong>Portability</strong></td>
              <td>Handler ties you to the platform</td>
              <td>Same image runs anywhere</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The concurrency row is the one that decides it for Spring Boot. Lambda gives each instance a
        single request at a time, so you pay the JVM&apos;s memory footprint per concurrent request
        and get none of the throughput a warm JVM is good at. Cloud Run sends many requests to one
        container, which is the model the framework was built for.
      </p>

      <div className="note">
        <span className="nt">If it has to be Lambda</span>
        Java cold starts on Lambda are the well-known complaint — classloading and context
        initialisation happen on the request that triggered the scale-up. <strong>SnapStart</strong>
        exists for exactly this: it snapshots an initialised JVM after startup and restores from
        that image, which removes most of the penalty. Provisioned concurrency does the same job by
        keeping instances warm, and costs accordingly. Plain Lambda with a Spring Boot fat jar and
        neither of those is the configuration people benchmark and then write angry posts about.
      </div>

      <p>
        My rule: Lambda for genuinely event-shaped work that finishes quickly — an S3 upload trigger,
        a scheduled cleanup, a webhook receiver. Cloud Run or Fargate for anything that is a service
        with an HTTP API, which a Spring Boot application almost always is.
      </p>

      <h2>Messaging: SQS against Pub/Sub</h2>
      <p>
        Both are at-least-once. Both hand you a message with a deadline and expect an
        acknowledgement. The vocabulary differs and the failure modes rhyme.
      </p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Concept</th><th>SQS</th><th>Pub/Sub</th></tr>
          </thead>
          <tbody>
            <tr><td>Time to process</td><td>Visibility timeout</td><td>Ack deadline</td></tr>
            <tr><td>Give up after N tries</td><td>Redrive policy → DLQ</td><td>Dead-letter topic</td></tr>
            <tr><td>Ordering</td><td>FIFO queues only</td><td>Ordering keys, per key</td></tr>
            <tr><td>Fan-out</td><td>SNS in front of queues</td><td>Built in — topic, many subscriptions</td></tr>
          </tbody>
        </table>
      </div>

      <Code lang="java" name="Two listeners, one handler">{`// static import: GcpPubSubHeaders.ORIGINAL_MESSAGE
@Component
@RequiredArgsConstructor
class OrderEvents {

  private final OrderService orders;
  private final ProcessedEvents processed;

  @SqsListener("order-events")               // AWS
  void onSqs(OrderEvent event, @Header("MessageId") String id) {
    handle(event, id);
  }

  @ServiceActivator(inputChannel = "orderEvents")   // GCP
  void onPubSub(
      OrderEvent event,
      @Header(ORIGINAL_MESSAGE) BasicAcknowledgeablePubsubMessage msg) {

    handle(event, msg.getPubsubMessage().getMessageId());
    msg.ack();
  }

  /** The part worth keeping identical. */
  private void handle(OrderEvent event, String id) {
    if (!processed.claim(id)) return;   // both deliver at least once
    orders.apply(event);
  }
}`}</Code>

      <p>
        Note what is shared and what is not. The transport bindings differ because they must; the
        business logic is one method, and it is idempotent because <em>both</em> platforms redeliver.
        That is the abstraction worth having — a shared handler — rather than a
        <code> MessageQueue</code> interface with two implementations that leaks the differences
        anyway.
      </p>

      <div className="note bad">
        <span className="nt">Resist the wrapper</span>
        The instinct is to build a cloud-agnostic messaging layer so the service &quot;doesn&apos;t
        care&quot;. It ends up exposing the union of both APIs, or the intersection — bloated or
        useless. Two thin adapters calling one handler is less code and easier to read than one
        abstraction pretending the clouds are the same.
      </div>

      <h2>Object storage: S3 against Cloud Storage</h2>
      <p>
        This is the closest pairing of the lot. Both are buckets of immutable objects with
        lifecycle rules, storage tiers and event notifications, and both are strongly consistent —
        S3 has been read-after-write consistent since 2020, so the &quot;eventual consistency&quot;
        advice still floating around is out of date.
      </p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Concept</th><th>S3</th><th>Cloud Storage</th></tr>
          </thead>
          <tbody>
            <tr><td>Namespace</td><td>Bucket names global per partition</td><td>Bucket names globally unique</td></tr>
            <tr><td>Temporary access</td><td>Presigned URL</td><td>Signed URL</td></tr>
            <tr><td>Cool tiers</td><td>Standard-IA, Glacier</td><td>Nearline, Coldline, Archive</td></tr>
            <tr><td>Change events</td><td>S3 notifications → SQS / SNS / Lambda</td><td>Notifications → Pub/Sub</td></tr>
          </tbody>
        </table>
      </div>

      <p>
        The one that matters in application code is temporary access. Do not stream a file through
        your service to hand it to a browser — issue a time-limited URL and let the client talk to
        storage directly. Your container stops being a proxy for bytes it has no opinion about.
      </p>

      <Code lang="java" name="Time-limited download links">{`// AWS — presigned GET, expires in 15 minutes
PresignedGetObjectRequest presigned = presigner.presignGetObject(r -> r
    .signatureDuration(Duration.ofMinutes(15))
    .getObjectRequest(g -> g.bucket("invoices").key(key)));

URL awsUrl = presigned.url();

// GCP — same idea, V4 signing
URL gcpUrl = storage.signUrl(
    BlobInfo.newBuilder("invoices", key).build(),
    15, TimeUnit.MINUTES,
    Storage.SignUrlOption.withV4Signature());`}</Code>

      <div className="note bad">
        <span className="nt">Signed does not mean private</span>
        A signed URL is a bearer token in a query string. It lands in browser history, in referrer
        headers, and in any log that records full URLs. Keep the expiry short — minutes, not days —
        and never treat one as a permanent link you can email out.
      </div>

      <p>
        The event wiring is worth noting too, because it is where the two diverge in shape. S3
        notifications fan out to SQS, SNS or Lambda directly; Cloud Storage sends everything to
        Pub/Sub and you subscribe from there. Same capability, one indirection apart — and it means
        the &quot;upload triggers processing&quot; pattern is wired differently even though the
        handler is identical.
      </p>

      <h2>Secrets, and the mistake everyone makes first</h2>
      <p>
        AWS calls it Secrets Manager. GCP calls it Secret Manager. The near-identical names are the
        least of it — what matters is that neither should end up in an environment variable you
        pasted by hand.
      </p>

      <Code lang="yaml" name="application-aws.yml">{`spring:
  config:
    import: aws-secretsmanager:/prod/order-service
  datasource:
    url: \${db-url}
    username: \${db-user}
    password: \${db-password}`}</Code>

      <Code lang="yaml" name="application-gcp.yml">{`spring:
  config:
    import: sm://
  datasource:
    url: \${sm://db-url}
    username: \${sm://db-user}
    password: \${sm://db-password}`}</Code>

      <p>
        Both starters resolve secrets at startup through <code>spring.config.import</code>, so the
        properties look the same to the rest of the application and only the profile differs. Rotate
        a secret and you restart the service — which is fine, and much better than a credential
        living in a deployment manifest in git.
      </p>

      <h2>Identity: stop shipping keys</h2>
      <p>
        This is the difference that matters most for security, and the one most often skipped
        because static credentials are quicker.
      </p>
      <ul>
        <li>
          <strong>AWS:</strong> give the ECS task an IAM <em>task role</em>. The SDK picks up
          temporary credentials from the container credentials endpoint through the default
          provider chain. No key, no secret, nothing to leak.
        </li>
        <li>
          <strong>GCP:</strong> run the service as a dedicated service account. Application Default
          Credentials resolve automatically on Cloud Run. No JSON key file.
        </li>
      </ul>

      <div className="note bad">
        <span className="nt">A downloaded key is a liability</span>
        A GCP service-account JSON or an AWS access key in an environment variable is a long-lived
        credential that never rotates, gets copied into local <code>.env</code> files, and ends up
        committed eventually. Both platforms give the workload an identity for free. Use it.
      </div>

      <h2>Databases: the connection is the difference</h2>
      <p>
        RDS and Cloud SQL both hand you managed PostgreSQL, and the SQL is the same. Connecting is
        not.
      </p>
      <p>
        Cloud SQL expects the Auth Proxy or the JDBC socket factory, which authenticates with your
        service account and encrypts the connection — a dependency and some JDBC URL properties, not
        a network rule. RDS is reached over the VPC, so access is a security-group problem instead.
      </p>

      <Code lang="yaml" name="Cloud SQL — connector, not an IP">{`spring:
  datasource:
    url: jdbc:postgresql:///orders
    hikari:
      data-source-properties:
        socketFactory: com.google.cloud.sql.postgres.SocketFactory
        cloudSqlInstance: my-project:asia-south1:orders-db`}</Code>

      <p>
        One thing that catches people on both: <strong>connection pools multiply by instance
        count.</strong> A pool of 10 looks modest until autoscaling gives you 40 containers and the
        database refuses connection 401. Size the pool against the instance ceiling, not against one
        container — and on a scale-to-zero platform, keep it small, because instances are cheap and
        connections are not.
      </p>

      <h2>What I would actually abstract</h2>
      <p>After doing this a few times, the line sits here:</p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Abstract it</th><th>Leave it cloud-specific</th></tr>
          </thead>
          <tbody>
            <tr><td>The business handler both listeners call</td><td>The listener annotations</td></tr>
            <tr><td>Property names the app reads</td><td>How those properties get populated</td></tr>
            <tr><td>Health and readiness endpoints</td><td>How the platform probes them</td></tr>
            <tr><td>The container image</td><td>The deployment manifest</td></tr>
          </tbody>
        </table>
      </div>

      <p>
        Spring profiles do most of the work. One <code>application.yml</code> for everything shared,
        an <code>application-aws.yml</code> and an <code>application-gcp.yml</code> for the wiring,
        and the profile set by the platform.
      </p>

      <div className="note good">
        <span className="nt">The short version</span>
        Portability lives in the image and the handler, not in a wrapper around the cloud. Both
        queues redeliver, so be idempotent either way. Let the workload have an identity instead of
        a key. Watch CPU throttling on scale-to-zero, and size connection pools against how many
        instances you might end up with, not how many you have today.
      </div>
    </>
  );
}
