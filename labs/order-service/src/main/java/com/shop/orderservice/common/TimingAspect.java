package com.shop.orderservice.common;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Logs how long each {@link Timed} method takes. Works through the Spring AOP proxy,
 * so internal calls via {@code this} are not timed.
 */
@Aspect
@Component
public class TimingAspect {

    private static final Logger log = LoggerFactory.getLogger(TimingAspect.class);

    @Around("@annotation(com.shop.orderservice.common.Timed)")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        String outcome = "ok";
        try {
            return pjp.proceed();
        } catch (Throwable ex) {
            outcome = ex.getClass().getSimpleName();
            throw ex;
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            log.info("TIMED {} took {} ms ({})", pjp.getSignature().toShortString(), ms, outcome);
        }
    }
}
