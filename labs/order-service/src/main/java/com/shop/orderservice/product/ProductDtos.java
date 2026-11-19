package com.shop.orderservice.product;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class ProductDtos {

    private ProductDtos() {
    }

    /** Used for both create (POST) and full update (PUT). */
    public record ProductRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price,
            @NotNull @PositiveOrZero Integer stock) {
    }

    public record ProductResponse(Long id, String name, BigDecimal price, int stock) {

        public static ProductResponse from(Product p) {
            return new ProductResponse(p.getId(), p.getName(), p.getPrice(), p.getStock());
        }
    }
}
