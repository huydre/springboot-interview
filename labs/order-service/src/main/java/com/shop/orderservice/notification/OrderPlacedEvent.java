package com.shop.orderservice.notification;

import java.math.BigDecimal;

/** Published inside the placeOrder transaction; listeners decide when to react. */
public record OrderPlacedEvent(Long orderId, String customerEmail, BigDecimal total) {
}
