package com.shop.orderservice.lab5;

import java.math.BigDecimal;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** A payment gateway that always declines, to drive the rollback scenarios. */
@Component
@Profile("lab5")
public class DecliningPaymentGateway {

    public void charge(Long orderId, BigDecimal amount) throws PaymentFailedException {
        throw new PaymentFailedException("Card declined for order " + orderId
                + ", amount " + amount);
    }
}
