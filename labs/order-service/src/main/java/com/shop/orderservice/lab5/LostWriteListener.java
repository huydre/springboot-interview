package com.shop.orderservice.lab5;

import com.shop.orderservice.notification.NotificationLog;
import com.shop.orderservice.notification.NotificationLogRepository;
import com.shop.orderservice.notification.OrderPlacedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * BUG for comparison with OrderEmailListener: writes in AFTER_COMMIT with the default
 * REQUIRED propagation. The write joins the already committed transaction and is lost.
 */
@Component
@Profile("lab5")
public class LostWriteListener {

    public static final String TYPE = "LAB5_REQUIRED_WRITE";
    private static final Logger log = LoggerFactory.getLogger(LostWriteListener.class);

    private final NotificationLogRepository logs;

    public LostWriteListener(NotificationLogRepository logs) {
        this.logs = logs;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderPlaced(OrderPlacedEvent event) {
        log.info("AFTER_COMMIT txActive={} txName={}",
                TransactionSynchronizationManager.isActualTransactionActive(),
                TransactionSynchronizationManager.getCurrentTransactionName());
        logs.save(new NotificationLog(event.orderId(), TYPE));
    }
}
