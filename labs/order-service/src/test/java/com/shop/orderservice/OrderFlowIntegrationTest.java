package com.shop.orderservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.shop.orderservice.customer.CustomerDtos.CustomerResponse;
import com.shop.orderservice.notification.EmailSender;
import com.shop.orderservice.order.OrderDtos.OrderResponse;
import com.shop.orderservice.order.OrderStatus;
import com.shop.orderservice.product.ProductDtos.ProductResponse;
import com.shop.orderservice.security.AuthController.TokenResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

/**
 * Full stack over HTTP on embedded H2 (profile "test"): the happy path of lab 4.
 * Since lab 7 every write needs a JWT, so the test logs in as admin first.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class OrderFlowIntegrationTest {

    @Autowired
    TestRestTemplate http;

    @Autowired
    EmailSender emailSender;

    @BeforeEach
    void loginAsAdmin() {
        TokenResponse token = http.postForObject("/auth/login",
                Map.of("username", "admin", "password", "admin123"), TokenResponse.class);
        http.getRestTemplate().getInterceptors().add((request, body, execution) -> {
            request.getHeaders().setBearerAuth(token.accessToken());
            return execution.execute(request, body);
        });
    }

    @Test
    void placeOrderHappyPath() {
        CustomerResponse customer = http.postForObject("/customers",
                Map.of("name", "An", "email", "an@example.com"), CustomerResponse.class);
        ProductResponse keyboard = http.postForObject("/products",
                Map.of("name", "Keyboard", "price", "100.00", "stock", 10),
                ProductResponse.class);
        ProductResponse mouse = http.postForObject("/products",
                Map.of("name", "Mouse", "price", "25.50", "stock", 5), ProductResponse.class);

        Map<String, Object> req = Map.of("customerId", customer.id(), "items", List.of(
                Map.of("productId", keyboard.id(), "quantity", 2),
                Map.of("productId", mouse.id(), "quantity", 1)));
        ResponseEntity<String> raw = http.postForEntity("/orders", req, String.class);
        System.out.println("LAB4 201 Location: " + raw.getHeaders().getLocation());
        System.out.println("LAB4 201 body: " + raw.getBody());
        assertThat(raw.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        OrderResponse order = http.getForObject(raw.getHeaders().getLocation(),
                OrderResponse.class);
        assertThat(order.status()).isEqualTo(OrderStatus.CREATED);
        assertThat(order.total()).isEqualByComparingTo(new BigDecimal("225.50"));
        assertThat(order.items()).hasSize(2);

        ProductResponse keyboardAfter = http.getForObject("/products/" + keyboard.id(),
                ProductResponse.class);
        assertThat(keyboardAfter.stock()).isEqualTo(8);
        assertThat(emailSender.sent()).extracting(EmailSender.SentEmail::subject)
                .contains("Order #" + order.id() + " confirmed");

        String health = http.getForObject("/actuator/health", String.class);
        System.out.println("LAB4 health: " + health);
        assertThat(health).contains("\"status\":\"UP\"");
    }
}
