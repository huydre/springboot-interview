package com.shop.orderservice.product;

import com.shop.orderservice.common.BusinessException;

public class InsufficientStockException extends BusinessException {

    public InsufficientStockException(Long productId, int available, int requested) {
        super("INSUFFICIENT_STOCK", "Product " + productId + " has only " + available
                + " in stock, requested " + requested);
    }
}
