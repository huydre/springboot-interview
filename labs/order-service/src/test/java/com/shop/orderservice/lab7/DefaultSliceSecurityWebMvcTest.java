package com.shop.orderservice.lab7;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.shop.orderservice.product.ProductController;
import com.shop.orderservice.product.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Same slice WITHOUT @Import(SecurityConfig.class): our rule "GET /products/** is public"
 * is not applied, Boot's default security protects everything.
 */
@WebMvcTest(ProductController.class)
class DefaultSliceSecurityWebMvcTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ApplicationContext context;

    @MockitoBean
    ProductService productService;

    @Test
    void ownSecurityConfigIsNotLoadedBySlice() throws Exception {
        System.out.println("LAB7 slice has SecurityConfig bean: "
                + context.containsBean("securityConfig"));
        mvc.perform(get("/products/1")).andExpect(status().isUnauthorized());
    }
}
