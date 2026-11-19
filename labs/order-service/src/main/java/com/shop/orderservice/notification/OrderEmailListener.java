package com.shop.orderservice.notification;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class OrderEmailListener {

    public static final String ORDER_CONFIRMATION = "ORDER_CONFIRMATION";

    private final EmailSender emailSender;
    private final NotificationLogService notificationLogs;

    public OrderEmailListener(EmailSender emailSender, NotificationLogService notificationLogs) {
        this.emailSender = emailSender;
        this.notificationLogs = notificationLogs;
    }

    /** Runs only if the order transaction commits; a rollback means no email. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderPlaced(OrderPlacedEvent event) {
        emailSender.send(event.customerEmail(), "Order #" + event.orderId() + " confirmed");
        notificationLogs.record(event.orderId(), ORDER_CONFIRMATION);
    }
}
