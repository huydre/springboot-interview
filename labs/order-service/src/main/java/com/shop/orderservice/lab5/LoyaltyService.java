package com.shop.orderservice.lab5;

import java.math.BigDecimal;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Secondary step that fails: the loyalty system is down. */
@Service
@Profile("lab5")
public class LoyaltyService {

    /** REQUIRED: joins the caller's transaction, a failure marks it rollback-only. */
    @Transactional
    public void addPoints(Long customerId, BigDecimal orderTotal) {
        throw new IllegalStateException("Loyalty service unavailable");
    }

    /** REQUIRES_NEW: a failure only rolls back this inner, separate transaction. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void addPointsInNewTx(Long customerId, BigDecimal orderTotal) {
        throw new IllegalStateException("Loyalty service unavailable");
    }
}
