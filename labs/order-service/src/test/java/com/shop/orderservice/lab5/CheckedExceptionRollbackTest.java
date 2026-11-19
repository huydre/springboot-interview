package com.shop.orderservice.lab5;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class CheckedExceptionRollbackTest extends Lab5TestBase {

    @Autowired
    CheckoutService checkout;

    @Test
    void bugCheckedExceptionStillCommits() {
        assertThatThrownBy(() -> checkout.checkoutBuggy(validOrder()))
                .isInstanceOf(PaymentFailedException.class)
                .satisfies(ex -> report("checked exception", ex.getMessage()));

        report("buggy orders", orders.count());
        report("buggy keyboard stock (was 10)", stockOf(keyboard));
        report("buggy emails", emailSender.sent().size());
        assertThat(orders.count()).isEqualTo(1);       // unpaid order committed
        assertThat(stockOf(keyboard)).isEqualTo(8);    // stock taken for an unpaid order
        assertThat(emailSender.sent())                 // and the customer got a confirmation
                .anyMatch(e -> e.subject().startsWith("Order #"));
    }

    @Test
    void fixRollbackForChecked() {
        assertThatThrownBy(() -> checkout.checkoutFixed(validOrder()))
                .isInstanceOf(PaymentFailedException.class);

        report("fixed orders", orders.count());
        report("fixed keyboard stock (was 10)", stockOf(keyboard));
        assertThat(orders.count()).isZero();
        assertThat(stockOf(keyboard)).isEqualTo(10);
        assertThat(emailSender.sent())
                .noneMatch(e -> e.subject().startsWith("Order #"));
    }
}
