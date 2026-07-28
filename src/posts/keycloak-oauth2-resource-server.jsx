import Code from '../components/Code';

export const meta = {
  title: 'Keycloak and Spring Security: Stop Writing Auth Filters',
  date: '2026-05-02',
  read: '9 min',
  tags: ['Keycloak', 'OAuth 2.0', 'Spring Security', 'Auth'],
  blurb:
    'Most Keycloak integrations carry hundreds of lines of custom filter code that Spring Security ' +
    'already does better. Here is the small correct configuration, plus how roles, scopes and ' +
    'service-to-service calls actually fit together.',
};

export default function Post() {
  return (
    <>
      <p>
        The first Keycloak integration I inherited had a custom <code>OncePerRequestFilter</code>, a
        hand-rolled JWT parser, a hard-coded public key in <code>application.yml</code>, and a
        comment saying <em>&quot;TODO: handle key rotation&quot;</em>. It worked. It was also about
        three hundred lines of liability standing in for roughly twelve lines of configuration.
      </p>
      <p>
        The useful mental model: <strong>Keycloak is your authorisation server, your services are
        resource servers.</strong> Once you say that out loud, most of the custom code becomes
        obviously unnecessary.
      </p>

      <h2>Who does what</h2>
      <ul>
        <li>
          <strong>Keycloak</strong> authenticates the human, handles MFA and password policy,
          and mints signed tokens. Your service never sees a password.
        </li>
        <li>
          <strong>Your Spring Boot service</strong> validates the signature against Keycloak&apos;s
          published keys, checks the claims, and maps them to authorities. Nothing more.
        </li>
      </ul>
      <p>
        Your service does not talk to Keycloak on every request. It fetches the JWKS once, caches
        it, and verifies locally — which is the entire performance argument for JWTs.
      </p>

      <h2>The configuration</h2>

      <Code lang="yaml" name="application.yml">{`spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # everything else is discovered from here
          issuer-uri: https://auth.example.com/realms/connect

app:
  audience: connect-api`}</Code>

      <p>
        That is the integration. On startup Spring hits{' '}
        <code>{'{issuer}/.well-known/openid-configuration'}</code>, reads the{' '}
        <code>jwks_uri</code>, and caches the signing keys against their <code>kid</code>. When
        Keycloak rotates keys, tokens carry the new <code>kid</code>, Spring refetches, and nothing
        breaks. That is the <code>TODO</code> from the intro, already solved.
      </p>

      <div className="note">
        <span className="nt">Container gotcha</span>
        In Docker, the issuer in the token (<code>https://auth.example.com/...</code>) must match{' '}
        <code>issuer-uri</code> exactly, even if your service reaches Keycloak at{' '}
        <code>http://keycloak:8080</code> internally. Set Keycloak&apos;s{' '}
        <code>KC_HOSTNAME</code> to the public URL and let the internal hostname resolve to it.
        Mismatched issuers are the single most common cause of a mysterious 401 here.
      </div>

      <h2>Keycloak roles are not Spring authorities</h2>
      <p>
        This trips up everyone once. Keycloak nests realm roles inside a claim Spring knows nothing
        about, so out of the box you get scopes but no roles, and{' '}
        <code>hasRole(&apos;ADMIN&apos;)</code> silently never matches.
      </p>

      <Code lang="json" name="Keycloak access token — the relevant part">{`{
  "sub": "8c2b1f04-5a9d-4e77-b0c3-91f2ad6e4b18",
  "aud": "connect-api",
  "scope": "openid profile order:read",
  "realm_access": {
    "roles": ["PHARMACY_ADMIN", "offline_access"]
  },
  "resource_access": {
    "connect-api": { "roles": ["ORDER_APPROVER"] }
  }
}`}</Code>

      <p>
        <code>realm_access.roles</code> applies across the realm;{' '}
        <code>resource_access.{'{client}'}.roles</code> is scoped to one client. Prefer the latter —
        realm roles leak across every service in the realm, which defeats the point of having
        separate services.
      </p>

      <Code lang="java" name="KeycloakAuthoritiesConverter.java">{`/**
 * Flattens Keycloak's nested role claims into Spring authorities:
 *   scope   -> SCOPE_order:read
 *   role    -> ROLE_ORDER_APPROVER
 */
public class KeycloakAuthoritiesConverter
    implements Converter<Jwt, Collection<GrantedAuthority>> {

  private static final String CLIENT_ID = "connect-api";
  private final JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();

  @Override
  public Collection<GrantedAuthority> convert(Jwt jwt) {
    Set<GrantedAuthority> authorities = new HashSet<>(scopes.convert(jwt));

    rolesFrom(jwt.getClaimAsMap("realm_access"))
        .forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));

    Map<String, Object> resource = jwt.getClaimAsMap("resource_access");
    if (resource != null && resource.get(CLIENT_ID) instanceof Map<?, ?> client) {
      rolesFrom(client).forEach(r ->
          authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
    }
    return authorities;
  }

  @SuppressWarnings("unchecked")
  private static Collection<String> rolesFrom(Map<?, ?> claim) {
    if (claim == null) return List.of();
    Object roles = claim.get("roles");
    return roles instanceof Collection ? (Collection<String>) roles : List.of();
  }
}`}</Code>

      <Code lang="java" name="SecurityConfig.java">{`@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
  JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
  converter.setJwtGrantedAuthoritiesConverter(new KeycloakAuthoritiesConverter());

  return http
      .csrf(CsrfConfigurer::disable)
      .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
      .authorizeHttpRequests(auth -> auth
          .requestMatchers("/actuator/health/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/v1/catalog/**").hasAuthority("SCOPE_catalog:read")
          .requestMatchers("/api/v1/admin/**").hasRole("PHARMACY_ADMIN")
          .anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(converter)))
      .build();
}`}</Code>

      <h3>Roles or scopes?</h3>
      <p>
        They answer different questions, and conflating them produces authorisation rules nobody can
        reason about later.
      </p>
      <ul>
        <li><strong>Scope</strong> — what the <em>client application</em> was permitted to ask for.</li>
        <li><strong>Role</strong> — what the <em>user</em> is allowed to do.</li>
      </ul>
      <p>
        A correct check is usually both: this client may write orders <em>and</em> this user is an
        approver. Scope alone means any token from that client passes. Role alone ignores what the
        user actually consented to.
      </p>

      <h2>Service-to-service calls</h2>
      <p>
        Internal calls have no user, so there is no user token to forward. Use the{' '}
        <strong>client credentials</strong> grant: the service authenticates as itself and gets a
        token with its own roles. Spring manages the lifecycle, including refresh.
      </p>

      <Code lang="yaml" name="application.yml">{`spring:
  security:
    oauth2:
      client:
        registration:
          inventory:
            provider: keycloak
            client-id: order-service
            client-secret: \${ORDER_SERVICE_SECRET}
            authorization-grant-type: client_credentials
            scope: inventory:write
        provider:
          keycloak:
            issuer-uri: https://auth.example.com/realms/connect`}</Code>

      <Code lang="java" name="Outbound client">{`@Bean
WebClient inventoryClient(OAuth2AuthorizedClientManager manager) {
  ServletOAuth2AuthorizedClientExchangeFilterFunction oauth =
      new ServletOAuth2AuthorizedClientExchangeFilterFunction(manager);
  oauth.setDefaultClientRegistrationId("inventory");

  return WebClient.builder()
      .baseUrl("http://inventory-service")
      .apply(oauth.oauth2Configuration())   // acquires + caches + refreshes the token
      .build();
}`}</Code>

      <div className="note bad">
        <span className="nt">Do not forward the user&apos;s token</span>
        Passing a user&apos;s access token down the call chain hands every downstream service the
        user&apos;s full privileges, and any one of them can then act as that user against a
        fourth. If a downstream service genuinely needs user context, pass the subject explicitly
        or use token exchange — deliberately, with a narrowed audience.
      </div>

      <h2>Testing without a running Keycloak</h2>
      <p>
        Spinning up Keycloak for unit tests is slow and flaky.{' '}
        <code>spring-security-test</code> can fabricate an authenticated JWT directly.
      </p>

      <Code lang="java" name="OrderControllerTest.java">{`@Test
@DisplayName("approver can approve; plain user cannot")
void approvalRequiresRole() throws Exception {
  mvc.perform(post("/api/v1/orders/42/approve")
          .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ORDER_APPROVER"))))
     .andExpect(status().isOk());

  mvc.perform(post("/api/v1/orders/42/approve")
          .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_VIEWER"))))
     .andExpect(status().isForbidden());
}`}</Code>

      <p>
        For integration tests where you want the real thing, Testcontainers has a Keycloak module
        that boots a realm from an exported JSON file. Worth it for the auth flows themselves;
        overkill for everything else.
      </p>

      <div className="note good">
        <span className="nt">The short version</span>
        Set <code>issuer-uri</code>, write one authorities converter because Keycloak nests its
        roles, check scope and role for different reasons, and use client credentials between
        services. Everything else Spring Security already does — and it handles key rotation, which
        your custom filter does not.
      </div>
    </>
  );
}
