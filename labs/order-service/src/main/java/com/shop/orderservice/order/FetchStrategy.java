package com.shop.orderservice.order;

/** How {@code GET /orders} loads the order graph; kept selectable to compare query counts. */
public enum FetchStrategy {
    /** Lazy loading one association at a time: 1 + N (+ products) queries. */
    NAIVE,
    JOIN_FETCH,
    ENTITY_GRAPH
}
