package com.shop.orderservice.lab5;

import com.shop.orderservice.common.ResourceNotFoundException;
import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderItemRequest;
import com.shop.orderservice.order.OrderService;
import com.shop.orderservice.product.Product;
import com.shop.orderservice.product.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Bug 1: self-invocation bypasses the proxy, so {@code @Transactional} does nothing. */
@Service
@Profile("lab5")
public class SelfInvocationOrderService {

    private static final Logger log = LoggerFactory.getLogger(SelfInvocationOrderService.class);

    private final ProductRepository products;
    private final OrderService orderService;
    private volatile boolean lastCallHadTransaction;

    public SelfInvocationOrderService(ProductRepository products, OrderService orderService) {
        this.products = products;
        this.orderService = orderService;
    }

    /** BUG: {@code this.reserveStock(...)} is a plain Java call on the target object. */
    public void placeOrderBuggy(CreateOrderRequest req) {
        reserveStock(req);
    }

    /** FIX: go through another bean, so the call passes its transactional proxy. */
    public void placeOrderFixed(CreateOrderRequest req) {
        orderService.placeOrder(req);
    }

    @Transactional
    public void reserveStock(CreateOrderRequest req) {
        lastCallHadTransaction = TransactionSynchronizationManager.isActualTransactionActive();
        log.info("reserveStock txActive={}", lastCallHadTransaction);
        for (OrderItemRequest line : req.items()) {
            Product p = products.findById(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", line.productId()));
            p.decreaseStock(line.quantity());
            products.save(p); // without a transaction, each save() commits on its own
        }
    }

    public boolean lastCallHadTransaction() {
        return lastCallHadTransaction;
    }
}
