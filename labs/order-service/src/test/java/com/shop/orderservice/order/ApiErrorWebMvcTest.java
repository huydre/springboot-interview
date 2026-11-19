package com.shop.orderservice.order;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.shop.orderservice.common.ResourceNotFoundException;
import com.shop.orderservice.product.InsufficientStockException;
import com.shop.orderservice.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Web slice only: controller + validation + GlobalExceptionHandler, service mocked.
 * {@code @WebMvcTest} does not load our SecurityConfig by itself (it would apply Boot's
 * default: everything needs login, CSRF on), so it is imported and a USER is mocked.
 */
@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
@WithMockUser
class ApiErrorWebMvcTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    OrderService orderService;

    @Test
    void invalidBodyReturns400WithFieldErrors() throws Exception {
        String body = """
                {"customerId": null, "items": [{"productId": 1, "quantity": 0}]}
                """;
        MvcResult result = mvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Validation failed"))
                .andExpect(jsonPath("$.errors[0]").value("customerId: must not be null"))
                .andExpect(jsonPath("$.errors[1]")
                        .value("items[0].quantity: must be greater than or equal to 1"))
                .andReturn();
        System.out.println("LAB4 400 body: " + result.getResponse().getContentAsString());
    }

    @Test
    void emptyItemsReturns400() throws Exception {
        MvcResult result = mvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\": 1, \"items\": []}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("items: must not be empty"))
                .andReturn();
        System.out.println("LAB4 400 empty items: " + result.getResponse().getContentAsString());
    }

    @Test
    void unknownOrderReturns404() throws Exception {
        given(orderService.findById(999L))
                .willThrow(new ResourceNotFoundException("Order", 999L));
        MvcResult result = mvc.perform(get("/orders/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Resource not found"))
                .andExpect(jsonPath("$.detail").value("Order 999 not found"))
                .andExpect(jsonPath("$.instance").value("/orders/999"))
                .andReturn();
        System.out.println("LAB4 404 body: " + result.getResponse().getContentAsString());
    }

    @Test
    void insufficientStockReturns422() throws Exception {
        given(orderService.placeOrder(any()))
                .willThrow(new InsufficientStockException(2L, 1, 5));
        MvcResult result = mvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\": 1, \"items\": [{\"productId\": 2, \"quantity\": 5}]}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_STOCK"))
                .andExpect(jsonPath("$.detail")
                        .value("Product 2 has only 1 in stock, requested 5"))
                .andReturn();
        System.out.println("LAB4 422 body: " + result.getResponse().getContentAsString());
    }

    @Test
    void unknownFetchStrategyReturns400() throws Exception {
        MvcResult result = mvc.perform(get("/orders").param("fetch", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andReturn();
        System.out.println("LAB6 400 bad fetch: " + result.getResponse().getContentAsString());
    }

    @Test
    void malformedJsonReturns400ProblemDetail() throws Exception {
        MvcResult result = mvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andReturn();
        System.out.println("LAB4 400 malformed: " + result.getResponse().getContentAsString());
    }
}
