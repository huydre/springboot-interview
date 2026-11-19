package com.shop.orderservice.common;

/** The request is well-formed but violates a business rule. Mapped to HTTP 422. */
public class BusinessException extends RuntimeException {

    private final String code;

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
