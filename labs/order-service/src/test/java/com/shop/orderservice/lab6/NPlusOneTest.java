package com.shop.orderservice.lab6;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** No batch fetching: the naive endpoint shows the classic 1 + N (+ products) pattern. */
class NPlusOneTest extends FetchCountTestBase {

    @Test
    void naiveLoadsItemsPerOrderAndProductsOneByOne() throws Exception {
        // 1 select orders + 10 selects of items (one per order) + 5 selects of products
        assertThat(statementsFor("NAIVE")).isEqualTo(1 + ORDERS + PRODUCTS);
    }

    @Test
    void joinFetchLoadsTheWholeGraphInOneQuery() throws Exception {
        assertThat(statementsFor("JOIN_FETCH")).isEqualTo(1);
    }

    @Test
    void entityGraphLoadsTheWholeGraphInOneQuery() throws Exception {
        assertThat(statementsFor("ENTITY_GRAPH")).isEqualTo(1);
    }
}
