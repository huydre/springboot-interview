package com.shop.orderservice.order;

import java.net.URI;
import java.util.List;

import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> place(@Valid @RequestBody CreateOrderRequest req) {
        OrderResponse created = orderService.placeOrder(req);
        return ResponseEntity.created(URI.create("/orders/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.findById(id);
    }

    /** {@code ?fetch=NAIVE|JOIN_FETCH|ENTITY_GRAPH}; NAIVE is kept to reproduce N+1. */
    @GetMapping
    public List<OrderResponse> list(
            @RequestParam(defaultValue = "ENTITY_GRAPH") FetchStrategy fetch) {
        return orderService.findAll(fetch);
    }
}
