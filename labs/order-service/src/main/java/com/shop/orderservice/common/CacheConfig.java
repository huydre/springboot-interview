package com.shop.orderservice.common;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;

/**
 * Redis cache: JSON values (DTO records are not Serializable), a TTL as the last safety net,
 * and transaction-aware puts/evicts so an evict only happens after the DB commit.
 * Declaring this bean means spring.cache.redis.* properties are ignored.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PRODUCT_CACHE = "product";

    @Bean
    RedisCacheConfiguration redisCacheConfiguration(
            @Value("${app.cache.product-ttl:10m}") Duration ttl) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(ttl)
                .disableCachingNullValues()
                .serializeValuesWith(SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer()));
    }

    @Bean
    RedisCacheManagerBuilderCustomizer transactionAwareCache() {
        return builder -> builder.transactionAware();
    }
}
