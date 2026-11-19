package com.shop.orderservice.lab5;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import com.shop.orderservice.notification.EmailSender.SentEmail;
import com.shop.orderservice.notification.OrderEmailListener;
import com.shop.orderservice.order.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class TransactionalEventTest extends Lab5TestBase {

    @Autowired
    OrderService orderService;

    @Autowired
    CheckoutService checkout;

    private List<String> afterCommitEmails() {
        return emailSender.sent().stream().map(SentEmail::subject)
                .filter(s -> s.startsWith("Order #")).toList();
    }

    private List<String> eagerEmails() {
        return emailSender.sent().stream().map(SentEmail::subject)
                .filter(s -> s.startsWith(EagerEmailListener.SUBJECT_PREFIX)).toList();
    }

    @Test
    void commitSendsAfterCommitEmail() {
        orderService.placeOrder(validOrder());

        report("commit: AFTER_COMMIT emails", afterCommitEmails());
        report("commit: @EventListener emails", eagerEmails());
        assertThat(afterCommitEmails()).hasSize(1);
        assertThat(eagerEmails()).hasSize(1);
    }

    @Test
    void rollbackSendsNoAfterCommitEmailButEagerListenerAlreadyFired() {
        assertThatThrownBy(() -> checkout.checkoutWithTimeout(validOrder()))
                .isInstanceOf(IllegalStateException.class)
                .satisfies(ex -> report("rollback cause", ex.getMessage()));

        report("rollback: orders", orders.count());
        report("rollback: AFTER_COMMIT emails", afterCommitEmails());
        report("rollback: @EventListener emails", eagerEmails());
        assertThat(orders.count()).isZero();
        assertThat(afterCommitEmails()).isEmpty();
        assertThat(eagerEmails()).hasSize(1); // email for an order that does not exist
    }

    @Test
    void writeInAfterCommitNeedsRequiresNew() {
        orderService.placeOrder(validOrder());

        long requiresNew = notificationLogs.countByType(OrderEmailListener.ORDER_CONFIRMATION);
        long required = notificationLogs.countByType(LostWriteListener.TYPE);
        report("AFTER_COMMIT write REQUIRES_NEW rows", requiresNew);
        report("AFTER_COMMIT write REQUIRED rows", required);
        assertThat(requiresNew).isEqualTo(1);
        assertThat(required).isZero(); // lost silently: no exception, no row
    }
}
