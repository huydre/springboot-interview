package com.shop.orderservice.product;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private int stock;

    /** Optimistic locking: every UPDATE adds "and version=?" and increments it. */
    @Version
    private Long version;

    protected Product() {
    }

    public Product(String name, BigDecimal price, int stock) {
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    public void update(String name, BigDecimal price, int stock) {
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    /** Takes {@code quantity} units out of stock or fails with a 422 business error. */
    public void decreaseStock(int quantity) {
        if (quantity > stock) {
            throw new InsufficientStockException(id, stock, quantity);
        }
        stock -= quantity;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getStock() {
        return stock;
    }

    public Long getVersion() {
        return version;
    }
}
