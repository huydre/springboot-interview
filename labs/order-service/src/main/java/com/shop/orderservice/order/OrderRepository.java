package com.shop.orderservice.order;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<Order, Long> {

    long countByCustomerId(Long customerId);

    /** One query: orders + items + products. Hibernate 6 removes duplicate parents itself. */
    @Query("select o from Order o left join fetch o.items i left join fetch i.product")
    List<Order> findAllWithItemsJoinFetch();

    /** Same graph declared with an entity graph instead of JPQL fetch joins. */
    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("select o from Order o")
    List<Order> findAllWithItemsEntityGraph();
}
