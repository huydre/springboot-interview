package com.shop.orderservice.lab7;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import com.shop.orderservice.security.AuthController.TokenResponse;
import com.shop.orderservice.support.PostgresTestcontainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

/**
 * Real HTTP server + real PostgreSQL (Testcontainers, @ServiceConnection): login, JWT,
 * 401 vs 403, and the order flow with a USER token.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(PostgresTestcontainersConfig.class)
class SecuredOrderFlowIntegrationTest {

    @Autowired
    TestRestTemplate http;

    @Test
    void jwtLoginRolesAndOrderFlow() {
        ResponseEntity<String> badLogin = http.postForEntity("/auth/login",
                Map.of("username", "admin", "password", "wrong"), String.class);
        System.out.println("LAB7 bad login: " + badLogin.getStatusCode().value() + " "
                + badLogin.getBody());
        assertThat(badLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        TokenResponse admin = login("admin", "admin123");
        TokenResponse user = login("user", "user123");
        System.out.println("LAB7 token: tokenType=" + user.tokenType() + " expiresIn="
                + user.expiresIn() + " length=" + user.accessToken().length());
        String[] parts = user.accessToken().split("\\.");
        System.out.println("LAB7 jwt header=" + decode(parts[0]));
        System.out.println("LAB7 jwt payload=" + decode(parts[1]));

        ResponseEntity<String> anonymous = call(HttpMethod.GET, "/orders", null, null);
        System.out.println("LAB7 GET /orders no token: " + anonymous.getStatusCode().value()
                + " WWW-Authenticate=" + anonymous.getHeaders().getFirst("WWW-Authenticate"));
        assertThat(anonymous.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<String> tampered = call(HttpMethod.GET, "/orders",
                user.accessToken().substring(0, user.accessToken().length() - 2) + "xx", null);
        System.out.println("LAB7 tampered token: " + tampered.getStatusCode().value()
                + " WWW-Authenticate=" + tampered.getHeaders().getFirst("WWW-Authenticate"));
        assertThat(tampered.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        Map<String, Object> keyboard = Map.of("name", "Keyboard", "price", "100.00",
                "stock", 10);
        ResponseEntity<String> userCreates = call(HttpMethod.POST, "/products",
                user.accessToken(), keyboard);
        System.out.println("LAB7 USER POST /products: " + userCreates.getStatusCode().value()
                + " WWW-Authenticate=" + userCreates.getHeaders().getFirst("WWW-Authenticate"));
        assertThat(userCreates.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> product = callForMap(HttpMethod.POST, "/products",
                admin.accessToken(), keyboard);
        ResponseEntity<Map> customer = callForMap(HttpMethod.POST, "/customers",
                admin.accessToken(), Map.of("name", "An", "email", "an@example.com"));
        assertThat(product.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(customer.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        Map<String, Object> order = Map.of("customerId", customer.getBody().get("id"),
                "items", List.of(Map.of("productId", product.getBody().get("id"),
                        "quantity", 2)));
        ResponseEntity<Map> placed = callForMap(HttpMethod.POST, "/orders",
                user.accessToken(), order);
        System.out.println("LAB7 USER POST /orders: " + placed.getStatusCode().value());
        assertThat(placed.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> list = call(HttpMethod.GET, "/orders", user.accessToken(), null);
        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(list.getBody()).contains("\"total\":200.00");
    }

    private TokenResponse login(String username, String password) {
        return http.postForObject("/auth/login",
                Map.of("username", username, "password", password), TokenResponse.class);
    }

    private ResponseEntity<String> call(HttpMethod method, String path, String token,
                                        Object body) {
        return http.exchange(path, method, entity(token, body), String.class);
    }

    @SuppressWarnings("rawtypes")
    private ResponseEntity<Map> callForMap(HttpMethod method, String path, String token,
                                           Object body) {
        return http.exchange(path, method, entity(token, body), Map.class);
    }

    private static HttpEntity<Object> entity(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.setBearerAuth(token);
        }
        return new HttpEntity<>(body, headers);
    }

    private static String decode(String base64Url) {
        return new String(Base64.getUrlDecoder().decode(base64Url), StandardCharsets.UTF_8);
    }
}
