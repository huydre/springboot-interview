package com.shop.orderservice.lab6;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Same naive code, but Hibernate groups lazy loads: items and products by id arrays. */
@TestPropertySource(properties = "spring.jpa.properties.hibernate.default_batch_fetch_size=50")
class BatchFetchSizeTest extends FetchCountTestBase {

    @Test
    void naiveWithBatchFetchSizeNeedsOneQueryPerAssociationLevel() throws Exception {
        // 1 select orders + 1 batched select of items + 1 batched select of products
        assertThat(statementsFor("NAIVE")).isEqualTo(3);
    }
}
