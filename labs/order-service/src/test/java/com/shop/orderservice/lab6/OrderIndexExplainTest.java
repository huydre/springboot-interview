package com.shop.orderservice.lab6;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import com.shop.orderservice.support.PostgresTestcontainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Seeds 100k orders for 1,000 customers in PostgreSQL, then runs EXPLAIN ANALYZE on
 * "the 20 newest PAID orders of one customer" without index, with a single-column index,
 * and with the composite index declared on the Order entity.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(PostgresTestcontainersConfig.class)
class OrderIndexExplainTest {

    static final String COMPOSITE = "idx_orders_customer_status_created";
    static final String QUERY = """
            select id, total, created_at from orders
            where customer_id = 42 and status = 'PAID'
            order by created_at desc limit 20""";
    static final int RUNS = 5;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PlatformTransactionManager txManager;

    @Test
    void compositeIndexRemovesSeqScanAndSort() {
        seed();
        jdbc.execute("drop index " + COMPOSITE); // created by Hibernate from @Table(indexes)
        jdbc.execute("analyze orders");

        String noIndex = explain("no index");
        assertThat(noIndex).contains("Seq Scan on orders").contains("Sort");

        jdbc.execute("create index idx_orders_customer on orders (customer_id)");
        jdbc.execute("analyze orders");
        String single = explain("index (customer_id)");
        assertThat(single).contains("Bitmap Index Scan on idx_orders_customer")
                .contains("Sort");

        jdbc.execute("drop index idx_orders_customer");
        jdbc.execute("create index " + COMPOSITE
                + " on orders (customer_id, status, created_at)");
        jdbc.execute("analyze orders");
        String composite = explain("index (customer_id, status, created_at)");
        assertThat(composite).contains("Index Scan Backward using " + COMPOSITE)
                .doesNotContain("Sort");
    }

    private void seed() {
        new TransactionTemplate(txManager).executeWithoutResult(s -> {
            jdbc.execute("delete from order_items");
            jdbc.execute("delete from orders");
            jdbc.execute("delete from customers");
            jdbc.queryForObject("select setseed(0.42)", Object.class); // same connection
            jdbc.update("""
                    insert into customers (id, name, email)
                    select g, 'Customer ' || g, 'c' || g || '@example.com'
                    from generate_series(1, 1000) g""");
            int rows = jdbc.update("""
                    insert into orders (id, customer_id, status, total, created_at)
                    select g, 1 + floor(random() * 1000)::int,
                           case when r < 0.6 then 'PAID'
                                when r < 0.9 then 'CREATED' else 'CANCELLED' end,
                           round((random() * 500)::numeric, 2),
                           timestamptz '2026-11-13 00:00:00+07'
                               - random() * interval '365 days'
                    from (select g, random() as r from generate_series(1, 100000) g) s""");
            System.out.println("LAB6 seeded orders=" + rows);
        });
        System.out.println("LAB6 table size=" + jdbc.queryForObject(
                "select pg_size_pretty(pg_relation_size('orders'))", String.class)
                + " customer 42 orders=" + jdbc.queryForObject(
                "select count(*) || ' (PAID ' || count(*) filter (where status = 'PAID') || ')'"
                        + " from orders where customer_id = 42", String.class));
    }

    /** Runs EXPLAIN ANALYZE several times; prints every timing and the last full plan. */
    private String explain(String label) {
        List<String> timings = new ArrayList<>();
        List<String> plan = List.of();
        for (int i = 0; i < RUNS; i++) {
            plan = jdbc.queryForList("explain (analyze, buffers) " + QUERY, String.class);
            plan.stream().filter(l -> l.startsWith("Execution Time"))
                    .forEach(l -> timings.add(l.replace("Execution Time: ", "")));
        }
        System.out.println("LAB6 EXPLAIN [" + label + "] runs=" + timings);
        plan.forEach(l -> System.out.println("LAB6 | " + l));
        return String.join("\n", plan);
    }
}
