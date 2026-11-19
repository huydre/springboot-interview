package com.shop.orderservice.lab5;

import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderResponse;
import com.shop.orderservice.order.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Bug 4: catching the inner exception does not save the outer transaction. */
@Service
@Profile("lab5")
public class LoyaltyCheckoutService {

    private static final Logger log = LoggerFactory.getLogger(LoyaltyCheckoutService.class);

    private final OrderService orderService;
    private final LoyaltyService loyaltyService;

    public LoyaltyCheckoutService(OrderService orderService, LoyaltyService loyaltyService) {
        this.orderService = orderService;
        this.loyaltyService = loyaltyService;
    }

    /** BUG: commit fails with UnexpectedRollbackException, the order is rolled back. */
    @Transactional
    public OrderResponse placeWithLoyaltyBuggy(CreateOrderRequest req) {
        OrderResponse order = orderService.placeOrder(req);
        try {
            loyaltyService.addPoints(req.customerId(), order.total());
        } catch (RuntimeException ex) {
            log.warn("Loyalty points skipped: {}", ex.getMessage());
        }
        return order;
    }

    /** FIX: the optional step runs in its own transaction, the order commits. */
    @Transactional
    public OrderResponse placeWithLoyaltyFixed(CreateOrderRequest req) {
        OrderResponse order = orderService.placeOrder(req);
        try {
            loyaltyService.addPointsInNewTx(req.customerId(), order.total());
        } catch (RuntimeException ex) {
            log.warn("Loyalty points skipped: {}", ex.getMessage());
        }
        return order;
    }
}
