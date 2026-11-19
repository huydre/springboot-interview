package com.shop.orderservice.lab5;

import com.shop.orderservice.audit.AuditLog;
import com.shop.orderservice.audit.AuditLogRepository;
import com.shop.orderservice.audit.AuditService;
import com.shop.orderservice.order.OrderDtos.CreateOrderRequest;
import com.shop.orderservice.order.OrderDtos.OrderResponse;
import com.shop.orderservice.order.OrderService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Bug 3: an audit row written in the caller's transaction disappears with its rollback. */
@Service
@Profile("lab5")
public class AuditedOrderService {

    public static final String ACTION = "ORDER_ATTEMPT";

    private final AuditLogRepository auditLogs;
    private final AuditService auditService;
    private final OrderService orderService;

    public AuditedOrderService(AuditLogRepository auditLogs, AuditService auditService,
                               OrderService orderService) {
        this.auditLogs = auditLogs;
        this.auditService = auditService;
        this.orderService = orderService;
    }

    /** BUG: the audit insert joins this transaction (REQUIRED) and is rolled back with it. */
    @Transactional
    public OrderResponse placeWithAuditSameTx(CreateOrderRequest req) {
        auditLogs.save(new AuditLog(ACTION, "customer=" + req.customerId()));
        return orderService.placeOrder(req);
    }

    /** FIX: AuditService.record() is REQUIRES_NEW, committed before the outer rollback. */
    @Transactional
    public OrderResponse placeWithAuditRequiresNew(CreateOrderRequest req) {
        auditService.record(ACTION, "customer=" + req.customerId());
        return orderService.placeOrder(req);
    }
}
