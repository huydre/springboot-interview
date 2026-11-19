package com.shop.orderservice.notification;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One row per notification sent, written after the order transaction has committed. */
@Entity
@Table(name = "notification_logs")
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected NotificationLog() {
    }

    public NotificationLog(Long orderId, String type) {
        this.orderId = orderId;
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getType() {
        return type;
    }
}
