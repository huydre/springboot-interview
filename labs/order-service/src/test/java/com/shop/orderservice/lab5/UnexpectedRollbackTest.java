package com.shop.orderservice.lab5;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.UnexpectedRollbackException;

class UnexpectedRollbackTest extends Lab5TestBase {

    @Autowired
    LoyaltyCheckoutService service;

    @Test
    void bugSwallowingInnerRequiredFailureStillRollsBack() {
        assertThatThrownBy(() -> service.placeWithLoyaltyBuggy(validOrder()))
                .isInstanceOf(UnexpectedRollbackException.class)
                .hasMessage("Transaction silently rolled back because it has been marked"
                        + " as rollback-only")
                .satisfies(ex -> report("exception", ex.getClass().getName()
                        + ": " + ex.getMessage()));

        report("buggy orders", orders.count());
        report("buggy keyboard stock (was 10)", stockOf(keyboard));
        assertThat(orders.count()).isZero();
        assertThat(stockOf(keyboard)).isEqualTo(10);
    }

    @Test
    void fixInnerRequiresNewKeepsOuterAlive() {
        service.placeWithLoyaltyFixed(validOrder());

        report("fixed orders", orders.count());
        report("fixed keyboard stock (was 10)", stockOf(keyboard));
        assertThat(orders.count()).isEqualTo(1);
        assertThat(stockOf(keyboard)).isEqualTo(8);
    }
}
