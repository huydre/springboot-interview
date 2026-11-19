package com.shop.orderservice.order;

import java.util.List;

import com.shop.orderservice.common.CacheConfig;
import com.shop.orderservice.common.ResourceNotFoundException;
import com.shop.orderservice.common.Timed;
import com.shop.orderservice.customer.Customer;
import com.shop.orderservice.customer.CustomerRepository;
import com.shop.orderservice.notification.OrderPlacedEvent;
import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderItemRequest;
import com.shop.orderservice.order.OrderDtos.OrderResponse;
import com.shop.orderservice.product.Product;
import com.shop.orderservice.product.ProductRepository;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orders;
    private final CustomerRepository customers;
    private final ProductRepository products;
    private final ApplicationEventPublisher events;
    private final CacheManager cacheManager;

    public OrderService(OrderRepository orders, CustomerRepository customers,
                        ProductRepository products, ApplicationEventPublisher events,
                        CacheManager cacheManager) {
        this.orders = orders;
        this.customers = customers;
        this.products = products;
        this.events = events;
        this.cacheManager = cacheManager;
    }

    /**
     * Creates the order and takes stock in one transaction: any failure (unknown product,
     * insufficient stock) rolls back every stock change. The confirmation email is sent by
     * an AFTER_COMMIT listener, so it only goes out when the order is really committed.
     */
    @Timed
    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest req) {
        Customer customer = customers.findById(req.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", req.customerId()));
        Order order = new Order(customer);
        for (OrderItemRequest line : req.items()) {
            Product product = products.findById(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", line.productId()));
            product.decreaseStock(line.quantity()); // managed entity: dirty checking saves it
            order.addItem(product, line.quantity());
            evictCachedProduct(product.getId()); // cached stock is now stale
        }
        Order saved = orders.save(order);
        events.publishEvent(new OrderPlacedEvent(saved.getId(), customer.getEmail(),
                saved.getTotal()));
        return OrderResponse.from(saved);
    }

    /** The cache manager is transaction-aware: the evict runs only if this tx commits. */
    private void evictCachedProduct(Long productId) {
        Cache cache = cacheManager.getCache(CacheConfig.PRODUCT_CACHE);
        if (cache != null) {
            cache.evict(productId);
        }
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return orders.findById(id)
                .map(OrderResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    /**
     * NAIVE loads lazy items/products one by one (N+1, see lab 6); with
     * hibernate.default_batch_fetch_size set, the same code issues batched queries instead.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> findAll(FetchStrategy strategy) {
        List<Order> result = switch (strategy) {
            case NAIVE -> orders.findAll();
            case JOIN_FETCH -> orders.findAllWithItemsJoinFetch();
            case ENTITY_GRAPH -> orders.findAllWithItemsEntityGraph();
        };
        return result.stream().map(OrderResponse::from).toList();
    }
}
