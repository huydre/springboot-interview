package com.shop.orderservice.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogs;

    public AuditService(AuditLogRepository auditLogs) {
        this.auditLogs = auditLogs;
    }

    /**
     * Runs in its own transaction (and its own connection): the audit row is committed even
     * if the caller's transaction rolls back afterwards. Cost: one extra pooled connection.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String detail) {
        auditLogs.save(new AuditLog(action, detail));
    }
}
