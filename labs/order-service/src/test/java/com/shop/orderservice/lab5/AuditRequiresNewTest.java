package com.shop.orderservice.lab5;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.shop.orderservice.product.InsufficientStockException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class AuditRequiresNewTest extends Lab5TestBase {

    @Autowired
    AuditedOrderService service;

    @Test
    void bugAuditInSameTransactionIsLostOnRollback() {
        assertThatThrownBy(() -> service.placeWithAuditSameTx(orderFailingOnSecondLine()))
                .isInstanceOf(InsufficientStockException.class);

        report("same-tx audit rows", auditLogs.countByAction(AuditedOrderService.ACTION));
        report("same-tx orders", orders.count());
        assertThat(auditLogs.countByAction(AuditedOrderService.ACTION)).isZero();
        assertThat(orders.count()).isZero();
    }

    @Test
    void fixRequiresNewAuditSurvivesOuterRollback() {
        assertThatThrownBy(() -> service.placeWithAuditRequiresNew(orderFailingOnSecondLine()))
                .isInstanceOf(InsufficientStockException.class);

        report("REQUIRES_NEW audit rows", auditLogs.countByAction(AuditedOrderService.ACTION));
        report("REQUIRES_NEW orders", orders.count());
        report("REQUIRES_NEW keyboard stock (was 10)", stockOf(keyboard));
        assertThat(auditLogs.countByAction(AuditedOrderService.ACTION)).isEqualTo(1);
        assertThat(orders.count()).isZero();
        assertThat(stockOf(keyboard)).isEqualTo(10);
    }
}
