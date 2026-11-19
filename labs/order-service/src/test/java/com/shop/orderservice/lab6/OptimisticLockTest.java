package com.shop.orderservice.lab6;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.shop.orderservice.order.OrderRepository;
import com.shop.orderservice.product.Product;
import com.shop.orderservice.product.ProductRepository;
import com.shop.orderservice.support.PostgresTestcontainersConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Two buyers read the same product version, then both write. Not @Transactional: each
 * thread runs its own transaction, exactly like two concurrent HTTP requests.
 */
@SpringBootTest(properties = "logging.level.org.hibernate.SQL=debug")
@ActiveProfiles("test")
@Import(PostgresTestcontainersConfig.class)
class OptimisticLockTest {

    @Autowired
    ProductRepository products;

    @Autowired
    OrderRepository orders;

    @Autowired
    PlatformTransactionManager txManager;

    TransactionTemplate tx;
    Long productId;

    @BeforeEach
    void seed() {
        tx = new TransactionTemplate(txManager);
        orders.deleteAll();
        products.deleteAll();
        productId = products.save(new Product("Keyboard", new BigDecimal("100.00"), 10)).getId();
    }

    @Test
    void secondWriterWithStaleVersionIsRejected() throws Exception {
        CyclicBarrier bothHaveRead = new CyclicBarrier(2);
        Callable<String> buyOne = () -> tx.execute(status -> {
            Product mine = products.findById(productId).orElseThrow(); // version 0, stock 10
            await(bothHaveRead);
            mine.decreaseStock(1); // dirty checking: UPDATE ... where id=? and version=?
            return "committed";
        });

        List<String> outcomes = runConcurrently(List.of(buyOne, buyOne));
        Product after = products.findById(productId).orElseThrow();
        System.out.println("LAB6 @Version outcomes=" + outcomes
                + " stock=" + after.getStock() + " version=" + after.getVersion());

        assertThat(outcomes).containsExactlyInAnyOrder("committed",
                "ObjectOptimisticLockingFailureException <- StaleObjectStateException");
        assertThat(after.getStock()).isEqualTo(9); // the loser did not overwrite silently
        assertThat(after.getVersion()).isEqualTo(1L);
    }

    @Test
    void atomicUpdateLetsBothBuyersSucceed() throws Exception {
        CyclicBarrier bothReady = new CyclicBarrier(2);
        Callable<String> buyOne = () -> {
            await(bothReady); // outside the transaction: no pooled connection held yet
            return tx.execute(status ->
                    "rows=" + products.decreaseStockAtomically(productId, 1));
        };

        List<String> outcomes = runConcurrently(List.of(buyOne, buyOne));
        Product after = products.findById(productId).orElseThrow();
        System.out.println("LAB6 atomic outcomes=" + outcomes
                + " stock=" + after.getStock() + " version=" + after.getVersion());

        assertThat(outcomes).containsExactly("rows=1", "rows=1");
        assertThat(after.getStock()).isEqualTo(8);
        assertThat(after.getVersion()).isEqualTo(2L);
    }

    @Test
    void atomicUpdateNeverOversells() throws Exception {
        int buyers = 20;
        // 20 threads > 10 pooled connections: wait at the barrier BEFORE opening a
        // transaction, otherwise 10 threads hold every connection while waiting forever.
        CyclicBarrier allReady = new CyclicBarrier(buyers);
        Callable<String> buyOne = () -> {
            await(allReady);
            return tx.execute(status ->
                    "rows=" + products.decreaseStockAtomically(productId, 1));
        };

        List<String> outcomes = runConcurrently(Collections.nCopies(buyers, buyOne));
        long succeeded = outcomes.stream().filter("rows=1"::equals).count();
        Product after = products.findById(productId).orElseThrow();
        System.out.println("LAB6 atomic x20 succeeded=" + succeeded
                + " stock=" + after.getStock());

        assertThat(succeeded).isEqualTo(10);
        assertThat(after.getStock()).isZero();
    }

    private static List<String> runConcurrently(List<Callable<String>> tasks)
            throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        try {
            List<String> outcomes = new ArrayList<>();
            for (Future<String> f : pool.invokeAll(tasks)) {
                try {
                    outcomes.add(f.get());
                } catch (ExecutionException e) {
                    Throwable ex = e.getCause();
                    System.out.println("LAB6 exception: " + ex);
                    if (ex.getCause() != null) {
                        System.out.println("LAB6 cause: " + ex.getCause());
                    }
                    outcomes.add(ex.getClass().getSimpleName()
                            + (ex instanceof ObjectOptimisticLockingFailureException
                            ? " <- " + ex.getCause().getClass().getSimpleName() : ""));
                }
            }
            return outcomes;
        } finally {
            pool.shutdown();
        }
    }

    private static void await(CyclicBarrier barrier) {
        try {
            barrier.await();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
