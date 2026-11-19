package com.shop.orderservice.lab6;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.shop.orderservice.customer.Customer;
import com.shop.orderservice.customer.CustomerRepository;
import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderItemRequest;
import com.shop.orderservice.order.OrderRepository;
import com.shop.orderservice.order.OrderService;
import com.shop.orderservice.product.Product;
import com.shop.orderservice.product.ProductRepository;
import com.shop.orderservice.support.PostgresTestcontainersConfig;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Seeds 10 orders x 3 items over 5 products, then counts the JDBC statements one
 * {@code GET /orders} request prepares (Hibernate statistics), per fetch strategy.
 */
@SpringBootTest(properties = {
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "logging.level.org.hibernate.SQL=debug"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(PostgresTestcontainersConfig.class)
@WithMockUser
abstract class FetchCountTestBase {

    static final int ORDERS = 10;
    static final int PRODUCTS = 5;

    @Autowired
    MockMvc mvc;

    @Autowired
    OrderService orderService;

    @Autowired
    OrderRepository orders;

    @Autowired
    ProductRepository products;

    @Autowired
    CustomerRepository customers;

    @Autowired
    EntityManagerFactory emf;

    @BeforeEach
    void seed() {
        orders.deleteAll();
        products.deleteAll();
        customers.deleteAll();
        Customer an = customers.save(new Customer("An", "an@example.com"));
        List<Product> catalog = new ArrayList<>();
        for (int i = 1; i <= PRODUCTS; i++) {
            catalog.add(products.save(new Product("Product " + i, new BigDecimal("10.00"), 100)));
        }
        for (int o = 0; o < ORDERS; o++) {
            List<OrderItemRequest> lines = new ArrayList<>();
            for (int k = 0; k < 3; k++) {
                lines.add(new OrderItemRequest(catalog.get((o + k) % PRODUCTS).getId(), 1));
            }
            orderService.placeOrder(new CreateOrderRequest(an.getId(), lines));
        }
    }

    /** Runs one GET /orders request and returns how many JDBC statements it prepared. */
    long statementsFor(String fetch) throws Exception {
        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();
        System.out.println("LAB6 >>> GET /orders?fetch=" + fetch);
        mvc.perform(get("/orders").param("fetch", fetch))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(ORDERS))
                .andExpect(jsonPath("$[0].items.length()").value(3));
        long count = stats.getPrepareStatementCount();
        System.out.println("LAB6 <<< fetch=" + fetch + " statements=" + count);
        return count;
    }
}
