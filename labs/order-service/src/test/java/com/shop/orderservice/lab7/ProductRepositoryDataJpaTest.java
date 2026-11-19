package com.shop.orderservice.lab7;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import com.shop.orderservice.product.Product;
import com.shop.orderservice.product.ProductRepository;
import com.shop.orderservice.support.PostgresTestcontainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * JPA slice on real PostgreSQL (not H2): repositories + Hibernate only, each test rolled
 * back at the end. Checks the atomic stock query and the @Version bump it does by hand.
 * Profile "test" matters: on a non-embedded database Boot defaults ddl-auto to "none",
 * so without create-drop the slice starts with no tables (relation "products_seq" missing).
 */
@DataJpaTest(properties = "logging.level.org.hibernate.SQL=debug")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(PostgresTestcontainersConfig.class)
class ProductRepositoryDataJpaTest {

    @Autowired
    ProductRepository products;

    @Autowired
    TestEntityManager em;

    @Test
    void atomicDecreaseTakesStockAndBumpsVersion() {
        Product p = em.persistFlushFind(new Product("Keyboard", new BigDecimal("100.00"), 3));
        assertThat(p.getVersion()).isZero();

        int taken = products.decreaseStockAtomically(p.getId(), 2);
        Product reloaded = products.findById(p.getId()).orElseThrow();

        assertThat(taken).isEqualTo(1);
        assertThat(reloaded.getStock()).isEqualTo(1);
        assertThat(reloaded.getVersion()).isEqualTo(1L);
    }

    @Test
    void atomicDecreaseRefusesWhenStockIsTooLow() {
        Product p = em.persistFlushFind(new Product("Monitor", new BigDecimal("50.00"), 1));

        int taken = products.decreaseStockAtomically(p.getId(), 5);

        assertThat(taken).isZero(); // caller turns 0 rows into "out of stock"
        assertThat(products.findById(p.getId()).orElseThrow().getStock()).isEqualTo(1);
    }
}
