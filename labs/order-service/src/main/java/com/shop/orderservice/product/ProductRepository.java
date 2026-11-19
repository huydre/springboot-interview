package com.shop.orderservice.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Atomic stock decrement: the database locks the row while it evaluates the condition,
     * so concurrent callers never lose an update and stock never goes negative. Bulk JPQL
     * bypasses @Version, so the version is bumped explicitly to keep optimistic readers safe.
     *
     * @return 1 if stock was taken, 0 if the product is missing or has too little stock
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            update Product p set p.stock = p.stock - :quantity, p.version = p.version + 1
            where p.id = :id and p.stock >= :quantity""")
    int decreaseStockAtomically(@Param("id") Long id, @Param("quantity") int quantity);
}
