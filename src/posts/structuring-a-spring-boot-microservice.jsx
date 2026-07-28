import Code from '../components/Code';

export const meta = {
  title: 'How I Structure a Spring Boot Microservice',
  date: '2025-12-11',
  read: '8 min',
  tags: ['Spring Boot', 'Architecture', 'Microservices'],
  blurb:
    'Package by feature, keep the domain free of Spring, and put every boundary concern in one ' +
    'place. The layout I have converged on after a few services that were painful to change.',
};

export default function Post() {
  return (
    <>
      <p>
        Every Spring tutorial ships the same three packages: <code>controller</code>,{' '}
        <code>service</code>, <code>repository</code>. It is fine for a demo and it ages badly. At
        forty classes you have three folders holding pieces of eight unrelated features, and adding
        one feature means touching all three while reading none of them fully.
      </p>
      <p>
        The layout below is what I have converged on. It is not clever — the value is entirely in
        the boundaries it makes hard to cross by accident.
      </p>

      <h2>Package by feature, not by layer</h2>

      <Code lang="text" name="src/main/java/com/example/orders">{`orders/
├─ OrderApplication.java
├─ config/                 # security, kafka, jackson, openapi
│   ├─ SecurityConfig.java
│   └─ KafkaConfig.java
├─ shared/                 # cross-feature only. resist filling this.
│   ├─ error/
│   │   ├─ ApiError.java
│   │   └─ GlobalExceptionHandler.java
│   └─ domain/Money.java
├─ order/                  # <- a feature owns its whole vertical
│   ├─ api/
│   │   ├─ OrderController.java
│   │   ├─ PlaceOrderRequest.java
│   │   └─ OrderView.java
│   ├─ domain/
│   │   ├─ Order.java             # no Spring imports below this line
│   │   ├─ OrderStatus.java
│   │   └─ OrderRepository.java   # interface, defined by the domain
│   ├─ application/
│   │   └─ PlaceOrderService.java
│   └─ infrastructure/
│       ├─ JpaOrderRepository.java
│       └─ OrderEventPublisher.java
└─ catalog/
    └─ ...`}</Code>

      <p>
        Everything about orders is in one place. Deleting the feature is deleting a directory. More
        usefully, a new engineer reading <code>order/</code> sees the whole story without opening
        anything else.
      </p>

      <h3>The one rule that makes it work</h3>
      <p>
        <strong>Dependencies point inwards.</strong> <code>api</code> may call{' '}
        <code>application</code>, which may call <code>domain</code>. Nothing points back out.{' '}
        <code>infrastructure</code> implements interfaces that <code>domain</code> declares.
      </p>
      <p>
        This is hexagonal architecture with less ceremony. The payoff is that domain logic is
        testable without a Spring context, a database, or a broker — which in practice means it
        actually gets tested.
      </p>

      <Code lang="java" name="order/domain/Order.java">{`/**
 * No @Entity, no @Component, no Spring on the classpath here.
 * Just the rules about what an order is allowed to do.
 */
public final class Order {

  private final OrderId id;
  private final CustomerId customer;
  private final List<OrderLine> lines;
  private OrderStatus status;

  public void cancel(Clock clock) {
    if (status == OrderStatus.SHIPPED) {
      throw new OrderAlreadyShipped(id);
    }
    if (status == OrderStatus.CANCELLED) {
      return;                       // cancelling twice is not an error
    }
    this.status = OrderStatus.CANCELLED;
    this.cancelledAt = clock.instant();
  }

  public Money total() {
    return lines.stream().map(OrderLine::subtotal).reduce(Money.ZERO, Money::plus);
  }
}`}</Code>

      <p>
        <code>Clock</code> is injected rather than calling <code>Instant.now()</code> inside. Time is
        an input like any other, and a domain that hides it is a domain you cannot test around
        midnight or across a month boundary.
      </p>

      <div className="note">
        <span className="nt">On separate JPA entities</span>
        Keeping the domain model and the JPA entity as separate classes with a mapper is the purest
        form of this, and it costs a mapping layer. On small services I let the entity be the
        domain model and keep the annotations confined to it. Pick deliberately — the failure mode
        is drifting into the mapping layer without deciding to.
      </div>

      <h2>Controllers stay thin</h2>
      <p>
        A controller translates HTTP into a call and back. If there is a conditional in it about
        business rules, that logic is in the wrong place.
      </p>

      <Code lang="java" name="order/api/OrderController.java">{`@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
class OrderController {

  private final PlaceOrderService placeOrder;

  @PostMapping
  @PreAuthorize("hasAuthority('SCOPE_order:write')")
  ResponseEntity<OrderView> place(@Valid @RequestBody PlaceOrderRequest request,
                                  @AuthenticationPrincipal Jwt principal) {

    Order order = placeOrder.handle(request.toCommand(principal.getSubject()));

    return ResponseEntity
        .created(URI.create("/api/v1/orders/" + order.id()))
        .body(OrderView.from(order));
  }
}`}</Code>

      <p>
        Note the class is package-private. Nothing outside <code>order.api</code> should be calling a
        controller directly, and the compiler can enforce that for free. Spring does not need public
        classes.
      </p>

      <h3>Never expose entities</h3>
      <p>
        Returning a JPA entity from a controller couples your public API to your schema — a column
        rename becomes a breaking API change, and lazy associations serialise into either extra
        queries or a <code>LazyInitializationException</code> at the worst moment. Records make the
        boundary cheap:
      </p>

      <Code lang="java" name="order/api/OrderView.java">{`public record OrderView(
    String id,
    String status,
    BigDecimal total,
    String currency,
    Instant placedAt,
    List<LineView> lines) {

  public static OrderView from(Order order) {
    return new OrderView(
        order.id().value(),
        order.status().name(),
        order.total().amount(),
        order.total().currency().getCurrencyCode(),
        order.placedAt(),
        order.lines().stream().map(LineView::from).toList());
  }
}`}</Code>

      <h2>One place for errors</h2>
      <p>
        Scattered try/catch produces inconsistent error shapes, and clients end up parsing three
        different formats from one service. Handle it once, centrally, in RFC 7807 form.
      </p>

      <Code lang="java" name="shared/error/GlobalExceptionHandler.java">{`@RestControllerAdvice
class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail onValidation(MethodArgumentNotValidException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    problem.setTitle("Validation failed");
    problem.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
        .collect(toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a)));
    return problem;
  }

  @ExceptionHandler(OrderNotFound.class)
  ProblemDetail onNotFound(OrderNotFound ex) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
    problem.setTitle("Order not found");
    problem.setDetail(ex.getMessage());
    return problem;
  }

  /** Catch-all: log the cause, tell the client nothing about it. */
  @ExceptionHandler(Exception.class)
  ProblemDetail onUnexpected(Exception ex) {
    String ref = UUID.randomUUID().toString();
    log.error("unhandled failure ref={}", ref, ex);

    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    problem.setTitle("Unexpected error");
    problem.setDetail("Something went wrong. Reference: " + ref);
    return problem;
  }
}`}</Code>

      <p>
        The reference ID is the part that pays for itself. A user reports eight characters, you grep
        the logs, and you have the stack trace — without ever leaking one to the client.
      </p>

      <h2>Configuration as typed objects</h2>
      <p>
        <code>@Value</code> scattered across classes means configuration errors surface at 3am on
        the code path that first needs them. Bind and validate at startup instead, so a bad
        environment fails the deploy rather than the request.
      </p>

      <Code lang="java" name="config/OrderProperties.java">{`@ConfigurationProperties(prefix = "app.orders")
@Validated
public record OrderProperties(
    @NotNull Duration paymentTimeout,
    @Positive int maxLinesPerOrder,
    @NotBlank String fulfilmentTopic) {}`}</Code>

      <h2>Tests that match the layout</h2>
      <ul>
        <li>
          <strong>Domain</strong> — plain JUnit, no Spring. Milliseconds. This is where the rules
          get tested, so it should be where most of the tests are.
        </li>
        <li>
          <strong>Application</strong> — mock the repository interfaces the domain declares.
        </li>
        <li>
          <strong>Web</strong> — <code>@WebMvcTest</code>, one slice, serialisation and status codes.
        </li>
        <li>
          <strong>Integration</strong> — Testcontainers against the real PostgreSQL and Kafka.
          Slow, few, and the only ones that prove the wiring works.
        </li>
      </ul>

      <div className="note bad">
        <span className="nt">Not H2</span>
        Testing against H2 while running PostgreSQL in production tests a database you do not ship.
        Dialect differences in JSON columns, upserts, sequences and locking are exactly where the
        interesting bugs live. Testcontainers costs a few seconds of startup and removes a whole
        category of &quot;works in tests, fails in prod&quot;.
      </div>

      <div className="note good">
        <span className="nt">The short version</span>
        Group by feature so changes are local. Point dependencies inwards so the domain stays
        testable. Keep controllers dumb, never return entities, handle errors once, bind config as
        validated types, and test against the database you actually deploy.
      </div>
    </>
  );
}
