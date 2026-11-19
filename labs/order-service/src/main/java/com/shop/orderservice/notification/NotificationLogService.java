package com.shop.orderservice.notification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationLogService {

    private final NotificationLogRepository logs;

    public NotificationLogService(NotificationLogRepository logs) {
        this.logs = logs;
    }

    /**
     * REQUIRES_NEW is mandatory when called from an AFTER_COMMIT listener: the original
     * transaction is already committed but still bound to the thread, so a REQUIRED write
     * would join it and never be committed.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long orderId, String type) {
        logs.save(new NotificationLog(orderId, type));
    }
}
