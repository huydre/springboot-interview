package com.shop.orderservice.notification;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Stand-in for an SMTP client: logs the email and keeps an in-memory list of what was sent,
 * so tests can assert whether an email went out.
 */
@Component
public class EmailSender {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final List<SentEmail> sent = new CopyOnWriteArrayList<>();

    public void send(String to, String subject) {
        log.info("EMAIL to={} subject=\"{}\"", to, subject);
        sent.add(new SentEmail(to, subject));
    }

    public List<SentEmail> sent() {
        return List.copyOf(sent);
    }

    public void clear() {
        sent.clear();
    }

    public record SentEmail(String to, String subject) {
    }
}
