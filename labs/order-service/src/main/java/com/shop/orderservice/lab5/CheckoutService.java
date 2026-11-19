package com.shop.orderservice.lab5;

import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderResponse;
import com.shop.orderservice.order.OrderService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bug 2: a checked exception does not trigger rollback.
 * Bug 5 (events): a runtime failure after the order was saved rolls everything back,
 * and the AFTER_COMMIT email listener must not fire.
 */
@Service
@Profile("lab5")
public class CheckoutService {

    private final OrderService orderService;
    private final DecliningPaymentGateway paymentGateway;

    public CheckoutService(OrderService orderService, DecliningPaymentGateway paymentGateway) {
        this.orderService = orderService;
        this.paymentGateway = paymentGateway;
    }

    /** BUG: PaymentFailedException is checked, so the order and stock change are committed. */
    @Transactional
    public OrderResponse checkoutBuggy(CreateOrderRequest req) throws PaymentFailedException {
        OrderResponse order = orderService.placeOrder(req);
        paymentGateway.charge(order.id(), order.total());
        return order;
    }

    /** FIX: declare the checked exception as a rollback rule. */
    @Transactional(rollbackFor = PaymentFailedException.class)
    public OrderResponse checkoutFixed(CreateOrderRequest req) throws PaymentFailedException {
        OrderResponse order = orderService.placeOrder(req);
        paymentGateway.charge(order.id(), order.total());
        return order;
    }

    /** A runtime failure after placeOrder() published OrderPlacedEvent: full rollback. */
    @Transactional
    public OrderResponse checkoutWithTimeout(CreateOrderRequest req) {
        OrderResponse order = orderService.placeOrder(req);
        throw new IllegalStateException("Payment provider timeout for order " + order.id());
    }
}
