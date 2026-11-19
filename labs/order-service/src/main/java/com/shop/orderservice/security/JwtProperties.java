package com.shop.orderservice.security;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * HS256 settings. The secret must be at least 32 bytes (256 bits); in a real deployment it
 * comes from the environment or a secret manager, never from the repository.
 */
@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, String issuer, Duration ttl) {
}
