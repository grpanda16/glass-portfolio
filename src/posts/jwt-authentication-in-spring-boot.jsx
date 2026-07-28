import Code from '../components/Code';

export const meta = {
  title: 'JWT Authentication in Spring Boot, End to End',
  date: '2026-06-14',
  read: '11 min',
  tags: ['JWT', 'Spring Security', 'Auth'],
  blurb:
    'What is actually inside a JWT, why the signature is the only part that matters, and how to ' +
    'issue, validate and rotate tokens in Spring Security 6 without building a session store by accident.',
};

export default function Post() {
  return (
    <>
      <p>
        Nearly every backend I have worked on ended up issuing JWTs, and nearly every one of them
        got at least one thing wrong on the first pass. Usually the same thing: treating the token
        as if it were secret. It is not. A JWT is <em>signed</em>, not encrypted — anyone holding
        one can read every claim inside it.
      </p>
      <p>
        This is the walkthrough I wish I had when I first wired Spring Security, JWT and Keycloak
        together at CureBay: what the format really is, what the server must verify, and where the
        design genuinely hurts.
      </p>

      <h2>Three segments, two dots</h2>
      <p>
        A JWT is three base64url-encoded segments joined by dots:{' '}
        <code>header.payload.signature</code>. Split one apart and it stops being mysterious.
      </p>

      <Code lang="json" name="header — decoded">{`{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "a3f1c9e2-2b77-4f0a-9d31-6c0e5b2a11de"
}`}</Code>

      <Code lang="json" name="payload — decoded">{`{
  "iss": "https://auth.example.com/realms/connect",
  "sub": "8c2b1f04-5a9d-4e77-b0c3-91f2ad6e4b18",
  "aud": "connect-api",
  "exp": 1781452800,
  "iat": 1781451900,
  "jti": "0f4a7c9e-11d2-4d6b-8e30-7a5c9b3f2d41",
  "scope": "order:read order:write",
  "roles": ["PHARMACY_ADMIN"]
}`}</Code>

      <p>
        Both are plain JSON, base64url-encoded. Base64 is an encoding, not a cipher — paste any
        token into a decoder and the payload comes straight out. The third segment is the only
        thing standing between that payload and an attacker rewriting{' '}
        <code>&quot;roles&quot;: [&quot;PHARMACY_ADMIN&quot;]</code> into something more
        interesting.
      </p>

      <div className="note bad">
        <span className="nt">Do not</span>
        Put anything in a JWT you would not print in a log line. No email addresses you are not
        happy leaking, no internal IDs that grant access on their own, never a password or an API
        key. The payload is public by construction.
      </div>

      <h2>The signature is the whole security model</h2>
      <p>
        The signature is computed over{' '}
        <code>base64url(header) + &quot;.&quot; + base64url(payload)</code>. Change one byte of
        either and verification fails. Which algorithm you sign with decides who is able to mint
        tokens.
      </p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Family</th><th>Key</th><th>Use when</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>HS256</strong></td>
              <td>One shared secret, signs and verifies</td>
              <td>A single service issues and consumes its own tokens</td>
            </tr>
            <tr>
              <td><strong>RS256 / ES256</strong></td>
              <td>Private key signs, public key verifies</td>
              <td>An auth server issues; many services verify</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The distinction matters more than it looks. With HS256, every service that can{' '}
        <em>verify</em> a token can also <em>forge</em> one — they hold the same secret. The moment
        you have more than one consumer, that is an unacceptable blast radius. Go asymmetric: the
        auth server keeps the private key, everyone else fetches public keys from a JWKS endpoint
        and can only check signatures.
      </p>

      <div className="note bad">
        <span className="nt">The classic exploit</span>
        Older libraries honoured <code>&quot;alg&quot;: &quot;none&quot;</code> from the header, or
        let an attacker swap RS256 for HS256 and sign with the <em>public</em> key as if it were an
        HMAC secret. Never let the token tell you how to verify it. Pin the expected algorithm
        server-side.
      </div>

      <h2>Validating tokens in Spring Security 6</h2>
      <p>
        Here is the part people over-engineer. If another system issues your tokens — Keycloak,
        Auth0, Cognito — you do not write a filter. Spring Security ships a resource server that
        does key discovery, caching, rotation and claim validation for you.
      </p>

      <Code lang="xml" name="pom.xml">{`<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>`}</Code>

      <Code lang="yaml" name="application.yml">{`spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/connect
          audiences: connect-api`}</Code>

      <p>
        That <code>issuer-uri</code> is doing real work. On startup Spring fetches{' '}
        <code>/.well-known/openid-configuration</code>, finds the JWKS URL, and caches the public
        keys — keyed by the <code>kid</code> in each token header, so key rotation on the auth
        server just works without a redeploy.
      </p>

      <Code lang="java" name="SecurityConfig.java">{`@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        // stateless API: no session to fixate, no CSRF token to leak
        .csrf(CsrfConfigurer::disable)
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health", "/api/v1/public/**").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth -> oauth
            .jwt(jwt -> jwt.jwtAuthenticationConverter(converter())))
        .build();
  }

  /** Map the realm's role claim onto Spring authorities. */
  private JwtAuthenticationConverter converter() {
    JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
    scopes.setAuthorityPrefix("SCOPE_");

    JwtAuthenticationConverter c = new JwtAuthenticationConverter();
    c.setJwtGrantedAuthoritiesConverter(jwt -> {
      Collection<GrantedAuthority> out = new ArrayList<>(scopes.convert(jwt));
      List<String> roles = jwt.getClaimAsStringList("roles");
      if (roles != null) {
        roles.stream()
             .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
             .forEach(out::add);
      }
      return out;
    });
    return c;
  }
}`}</Code>

      <p>
        <code>anyRequest().authenticated()</code> as the last rule is deliberate. Default-deny means
        a new controller is protected the moment it exists — the alternative fails open, and that
        failure is silent.
      </p>

      <h3>Verify the audience, not just the signature</h3>
      <p>
        A valid signature only proves the token came from your issuer. It does not prove the token
        was meant for <em>this</em> service. Without an audience check, a token minted for the
        low-privilege reporting API is accepted by the payments API.
      </p>

      <Code lang="java" name="Audience validation">{`@Bean
JwtDecoder jwtDecoder(OAuth2ResourceServerProperties props) {
  String issuer = props.getJwt().getIssuerUri();
  NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);

  decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
      JwtValidators.createDefaultWithIssuer(issuer),   // exp, nbf, iss
      new JwtClaimValidator<List<String>>(
          "aud", aud -> aud != null && aud.contains("connect-api"))));

  return decoder;
}`}</Code>

      <h2>Issuing your own tokens</h2>
      <p>
        When you <em>are</em> the auth server, sign with a private key and expose the public one.
        Spring Security&apos;s <code>JwtEncoder</code> handles the encoding.
      </p>

      <Code lang="java" name="TokenService.java">{`@Service
public class TokenService {

  private static final Duration ACCESS_TTL = Duration.ofMinutes(10);

  private final JwtEncoder encoder;

  public String accessToken(UserPrincipal user) {
    Instant now = Instant.now();

    JwtClaimsSet claims = JwtClaimsSet.builder()
        .issuer("https://auth.example.com")
        .audience(List.of("connect-api"))
        .subject(user.id().toString())
        .issuedAt(now)
        .expiresAt(now.plus(ACCESS_TTL))
        .id(UUID.randomUUID().toString())          // jti, for revocation lists
        .claim("scope", String.join(" ", user.scopes()))
        .claim("roles", user.roles())
        .build();

    JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
    return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
  }
}`}</Code>

      <p>
        Ten minutes is not arbitrary. Short expiry is the only revocation mechanism a stateless
        token has — which brings us to the trade-off nobody advertises.
      </p>

      <h2>The revocation problem</h2>
      <p>
        Sessions are revocable because the server holds the state: delete the row, the session is
        gone. A JWT is the opposite. It is valid because it says so and the maths agrees. Ban a
        user at 10:02 and their token still opens every door until <code>exp</code>.
      </p>
      <p>There are three honest answers, and one dishonest one:</p>
      <ul>
        <li>
          <strong>Short-lived access tokens.</strong> Cap the damage at a few minutes. Simple, and
          right for most systems.
        </li>
        <li>
          <strong>A denylist of <code>jti</code> values</strong> in Redis, expiring at the
          token&apos;s own <code>exp</code>. Bounded in size, gives instant revocation.
        </li>
        <li>
          <strong>A token version per user.</strong> Put <code>ver</code> in the claims, compare it
          to the user record, bump it to invalidate everything they hold.
        </li>
        <li>
          <em>The dishonest one:</em> checking the database on every request to confirm the user is
          still active. That works — and you have rebuilt sessions with extra steps and worse
          ergonomics. If you need that, use sessions.
        </li>
      </ul>

      <h2>Refresh tokens, and rotating them properly</h2>
      <p>
        Short access tokens mean re-authenticating constantly unless you pair them with a refresh
        token: long-lived, opaque, stored server-side, and used only against the token endpoint.
      </p>
      <p>
        Naive refresh handling hands back the same refresh token forever. If it is ever stolen, the
        attacker has permanent access and you will never know. <strong>Rotation with reuse
        detection</strong> fixes that: every refresh issues a new token and invalidates the old
        one, so a replayed token is proof of compromise.
      </p>

      <Code lang="java" name="RefreshService.java">{`@Transactional
public TokenPair refresh(String presented) {
  RefreshToken token = repo.findByHash(sha256(presented))
      .orElseThrow(() -> new BadCredentialsException("unknown refresh token"));

  // Already rotated away => someone replayed an old token.
  // Assume the family is compromised and revoke all of it.
  if (token.isRotated()) {
    repo.revokeFamily(token.familyId());
    log.warn("refresh token reuse detected for family {}", token.familyId());
    throw new BadCredentialsException("token reuse detected");
  }

  if (token.expiresAt().isBefore(Instant.now())) {
    throw new CredentialsExpiredException("refresh token expired");
  }

  token.markRotated();
  RefreshToken next = repo.save(RefreshToken.issue(token.userId(), token.familyId()));

  return new TokenPair(tokens.accessToken(token.user()), next.plaintext());
}`}</Code>

      <p>
        Store the <em>hash</em> of the refresh token, never the value. A leaked database dump then
        yields nothing usable — the same reasoning that applies to passwords.
      </p>

      <h2>Where to keep the token in the browser</h2>
      <p>
        This is where most front-end JWT advice goes wrong. <code>localStorage</code> is readable by
        any JavaScript on the page, which means one XSS — one compromised npm dependency — and the
        token walks out.
      </p>
      <p>
        The safer arrangement is an <code>HttpOnly</code>, <code>Secure</code>,{' '}
        <code>SameSite=Strict</code> cookie. JavaScript cannot read it, so XSS cannot exfiltrate it.
        Cookies reintroduce CSRF, but <code>SameSite</code> plus a CSRF token on state-changing
        routes is a well-understood problem with a well-understood fix. XSS token theft is neither.
      </p>

      <Code lang="java" name="Setting the refresh cookie">{`ResponseCookie cookie = ResponseCookie.from("refresh_token", value)
    .httpOnly(true)
    .secure(true)
    .sameSite("Strict")
    .path("/api/v1/auth/refresh")   // sent nowhere else
    .maxAge(Duration.ofDays(14))
    .build();

return ResponseEntity.ok()
    .header(HttpHeaders.SET_COOKIE, cookie.toString())
    .body(new AccessTokenResponse(accessToken));`}</Code>

      <p>
        Note the <code>path</code>. The refresh token is attached only to the refresh endpoint, so
        it is not broadcast on every API call it has no business being part of.
      </p>

      <h2>The checklist</h2>
      <p>What I actually verify before an auth change ships:</p>
      <ul>
        <li>Algorithm is pinned server-side; <code>alg</code> from the token is never trusted.</li>
        <li><code>iss</code>, <code>aud</code> and <code>exp</code> are all validated, not just the signature.</li>
        <li>Access tokens expire in minutes, not days.</li>
        <li>Refresh tokens rotate, are stored hashed, and reuse revokes the family.</li>
        <li>No secrets, no PII beyond an opaque subject, in the payload.</li>
        <li>Clock skew allowance is small and deliberate — 30 seconds, not five minutes.</li>
        <li>The last authorisation rule is <code>authenticated()</code>, so new endpoints fail closed.</li>
      </ul>

      <div className="note good">
        <span className="nt">The short version</span>
        A JWT is a signed claim you chose to believe without asking the database. That is exactly
        why it scales, and exactly why revoking one is hard. Keep them short-lived, verify every
        claim you depend on, and never confuse signed with secret.
      </div>
    </>
  );
}
