package com.shop.orderservice.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public final class OrderDtos {

    private OrderDtos() {
    }

    public record CreateOrderRequest(
            @NotNull Long customerId,
            @NotEmpty List<@Valid @NotNull OrderItemRequest> items) {
    }

    public record OrderItemRequest(
            @NotNull Long productId,
            @NotNull @Min(1) @Max(1000) Integer quantity) {
    }

    public record OrderItemResponse(Long productId, String productName, int quantity,
                                    BigDecimal unitPrice) {

        static OrderItemResponse from(OrderItem i) {
            return new OrderItemResponse(i.getProduct().getId(), i.getProduct().getName(),
                    i.getQuantity(), i.getUnitPrice());
        }
    }

    public record OrderResponse(Long id, Long customerId, OrderStatus status, BigDecimal total,
                                Instant createdAt, List<OrderItemResponse> items) {

        /** Must be called inside a transaction: it touches lazy associations. */
        public static OrderResponse from(Order o) {
            return new OrderResponse(o.getId(), o.getCustomer().getId(), o.getStatus(),
                    o.getTotal(), o.getCreatedAt(),
                    o.getItems().stream().map(OrderItemResponse::from).toList());
        }
    }
}
