package com.shop.orderservice.lab5;

import java.math.BigDecimal;
import java.util.List;

import com.shop.orderservice.audit.AuditLogRepository;
import com.shop.orderservice.customer.Customer;
import com.shop.orderservice.customer.CustomerRepository;
import com.shop.orderservice.notification.EmailSender;
import com.shop.orderservice.notification.NotificationLogRepository;
import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderItemRequest;
import com.shop.orderservice.order.OrderRepository;
import com.shop.orderservice.product.Product;
import com.shop.orderservice.product.ProductRepository;
import com.shop.orderservice.support.PostgresTestcontainersConfig;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Shared setup for lab 5. Deliberately NOT @Transactional: a test transaction would wrap the
 * service calls, hide commit-time behaviour (UnexpectedRollbackException, AFTER_COMMIT) and
 * roll everything back. Instead each test starts from a clean, freshly seeded database.
 * JpaTransactionManager logs at DEBUG so the console shows where transactions begin,
 * join, suspend, commit and roll back.
 */
@SpringBootTest(properties =
        "logging.level.org.springframework.orm.jpa.JpaTransactionManager=debug")
@ActiveProfiles({"test", "lab5"})
@Import(PostgresTestcontainersConfig.class)
abstract class Lab5TestBase {

    @Autowired protected OrderRepository orders;
    @Autowired protected ProductRepository products;
    @Autowired protected CustomerRepository customers;
    @Autowired protected AuditLogRepository auditLogs;
    @Autowired protected NotificationLogRepository notificationLogs;
    @Autowired protected EmailSender emailSender;

    protected Customer customer;
    /** price 100.00, stock 10 */
    protected Product keyboard;
    /** price 50.00, stock 1 */
    protected Product monitor;

    @BeforeEach
    void resetDatabase() {
        orders.deleteAll(); // cascades to order_items
        products.deleteAll();
        customers.deleteAll();
        auditLogs.deleteAll();
        notificationLogs.deleteAll();
        emailSender.clear();

        customer = customers.save(new Customer("An", "an@example.com"));
        keyboard = products.save(new Product("Keyboard", new BigDecimal("100.00"), 10));
        monitor = products.save(new Product("Monitor", new BigDecimal("50.00"), 1));
    }

    /** 2 keyboards: always succeeds. */
    protected CreateOrderRequest validOrder() {
        return new CreateOrderRequest(customer.getId(),
                List.of(new OrderItemRequest(keyboard.getId(), 2)));
    }

    /** 2 keyboards, then 5 monitors while only 1 is in stock: fails on the second line. */
    protected CreateOrderRequest orderFailingOnSecondLine() {
        return new CreateOrderRequest(customer.getId(), List.of(
                new OrderItemRequest(keyboard.getId(), 2),
                new OrderItemRequest(monitor.getId(), 5)));
    }

    protected int stockOf(Product p) {
        return products.findById(p.getId()).orElseThrow().getStock();
    }

    protected static void report(String label, Object value) {
        System.out.println("LAB5 " + label + ": " + value);
    }
}
