package com.shop.orderservice.lab5;

/** Checked on purpose: by default Spring does NOT roll back on checked exceptions. */
public class PaymentFailedException extends Exception {

    public PaymentFailedException(String message) {
        super(message);
    }
}
