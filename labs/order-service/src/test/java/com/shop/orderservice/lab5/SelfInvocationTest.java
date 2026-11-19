package com.shop.orderservice.lab5;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.shop.orderservice.product.InsufficientStockException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class SelfInvocationTest extends Lab5TestBase {

    @Autowired
    SelfInvocationOrderService service;

    @Test
    void bugSelfInvocationRunsWithoutTransactionAndLeavesPartialWrites() {
        assertThatThrownBy(() -> service.placeOrderBuggy(orderFailingOnSecondLine()))
                .isInstanceOf(InsufficientStockException.class);

        report("self-invocation txActive", service.lastCallHadTransaction());
        report("self-invocation keyboard stock (was 10)", stockOf(keyboard));
        assertThat(service.lastCallHadTransaction()).isFalse();
        assertThat(stockOf(keyboard)).isEqualTo(8); // first line committed on its own
    }

    @Test
    void proxyCallRunsInTransaction() {
        service.reserveStock(validOrder()); // called from outside: goes through the proxy
        report("proxy call txActive", service.lastCallHadTransaction());
        assertThat(service.lastCallHadTransaction()).isTrue();
    }

    @Test
    void fixCallThroughAnotherBeanRollsBackEverything() {
        assertThatThrownBy(() -> service.placeOrderFixed(orderFailingOnSecondLine()))
                .isInstanceOf(InsufficientStockException.class);

        report("fixed keyboard stock (was 10)", stockOf(keyboard));
        assertThat(stockOf(keyboard)).isEqualTo(10);
        assertThat(orders.count()).isZero();
    }
}
