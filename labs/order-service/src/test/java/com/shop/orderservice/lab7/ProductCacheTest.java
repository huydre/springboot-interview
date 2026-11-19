package com.shop.orderservice.lab7;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
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
import com.shop.orderservice.support.RedisTestcontainersConfig;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** GET /products/{id} cached in a real Redis; DB hits counted with Hibernate statistics. */
@SpringBootTest(properties = {
        "spring.cache.type=redis",
        "spring.jpa.properties.hibernate.generate_statistics=true"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({PostgresTestcontainersConfig.class, RedisTestcontainersConfig.class})
class ProductCacheTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ProductRepository products;

    @Autowired
    OrderRepository orders;

    @Autowired
    CustomerRepository customers;

    @Autowired
    OrderService orderService;

    @Autowired
    StringRedisTemplate redis;

    @Autowired
    CacheManager cacheManager;

    @Autowired
    EntityManagerFactory emf;

    Statistics stats;
    Long id;

    @BeforeEach
    void seed() {
        orders.deleteAll();
        products.deleteAll();
        customers.deleteAll();
        redis.getConnectionFactory().getConnection().serverCommands().flushAll();
        id = products.save(new Product("Keyboard", new BigDecimal("100.00"), 10)).getId();
        stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();
    }

    @Test
    void cacheHitSkipsDatabaseAndUpdateEvicts() throws Exception {
        System.out.println("LAB7 cacheManager=" + cacheManager.getClass().getSimpleName());
        String key = "product::" + id;

        getProduct("100.0");
        long afterFirst = stats.getPrepareStatementCount();
        Long ttl = redis.getExpire(key);
        System.out.println("LAB7 after GET #1 db=" + afterFirst + " ttl=" + ttl
                + " value=" + redis.opsForValue().get(key));

        getProduct("100.0");
        getProduct("100.0");
        long afterThree = stats.getPrepareStatementCount();
        System.out.println("LAB7 after GET #2,#3 db=" + afterThree);

        mvc.perform(put("/products/" + id)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Keyboard\",\"price\":90.00,\"stock\":10}"))
                .andExpect(status().isOk());
        long afterUpdate = stats.getPrepareStatementCount();
        Boolean stillCached = redis.hasKey(key);
        System.out.println("LAB7 after PUT db=" + afterUpdate + " keyExists=" + stillCached);

        getProduct("90.0");
        long afterFourth = stats.getPrepareStatementCount();
        System.out.println("LAB7 after GET #4 db=" + afterFourth);

        assertThat(afterFirst).isEqualTo(1);          // miss: one SELECT
        assertThat(ttl).isBetween(590L, 600L);        // 10 minutes TTL
        assertThat(afterThree).isEqualTo(afterFirst); // hits: no SQL at all
        assertThat(stillCached).isFalse();            // evicted after the update committed
        assertThat(afterFourth).isEqualTo(afterUpdate + 1); // miss again, fresh price
    }

    @Test
    void placingAnOrderEvictsTheCachedStock() throws Exception {
        Customer an = customers.save(new Customer("An", "an@example.com"));
        getProduct("100.0"); // cached with stock 10
        orderService.placeOrder(new CreateOrderRequest(an.getId(),
                List.of(new OrderItemRequest(id, 2))));
        mvc.perform(get("/products/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(8));
    }

    private void getProduct(String expectedPrice) throws Exception {
        mvc.perform(get("/products/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(Double.parseDouble(expectedPrice)));
    }
}
