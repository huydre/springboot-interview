package com.shop.orderservice.lab5;

import com.shop.orderservice.notification.EmailSender;
import com.shop.orderservice.notification.OrderPlacedEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Anti-pattern for comparison: a plain @EventListener runs at publish time, even if the
 *  transaction later rolls back. */
@Component
@Profile("lab5")
public class EagerEmailListener {

    public static final String SUBJECT_PREFIX = "[EAGER] ";

    private final EmailSender emailSender;

    public EagerEmailListener(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @EventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        emailSender.send(event.customerEmail(),
                SUBJECT_PREFIX + "Order #" + event.orderId() + " confirmed");
    }
}
