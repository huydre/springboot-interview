package com.shop.orderservice.product;

import java.util.List;

import com.shop.orderservice.common.CacheConfig;
import com.shop.orderservice.common.ResourceNotFoundException;
import com.shop.orderservice.common.Timed;
import com.shop.orderservice.product.ProductDtos.ProductRequest;
import com.shop.orderservice.product.ProductDtos.ProductResponse;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository products;

    public ProductService(ProductRepository products) {
        this.products = products;
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        Product saved = products.save(new Product(req.name(), req.price(), req.stock()));
        return ProductResponse.from(saved);
    }

    @Timed
    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        return products.findAll().stream().map(ProductResponse::from).toList();
    }

    /** Cache-aside on Redis: a hit returns without touching the database. */
    @Cacheable(cacheNames = CacheConfig.PRODUCT_CACHE, key = "#id")
    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return ProductResponse.from(load(id));
    }

    @CacheEvict(cacheNames = CacheConfig.PRODUCT_CACHE, key = "#id")
    @Transactional
    public ProductResponse update(Long id, ProductRequest req) {
        Product product = load(id);
        product.update(req.name(), req.price(), req.stock()); // dirty checking writes the UPDATE
        return ProductResponse.from(product);
    }

    @CacheEvict(cacheNames = CacheConfig.PRODUCT_CACHE, key = "#id")
    @Transactional
    public void delete(Long id) {
        products.delete(load(id));
    }

    private Product load(Long id) {
        return products.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }
}
