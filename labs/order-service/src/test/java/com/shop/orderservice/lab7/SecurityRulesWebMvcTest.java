package com.shop.orderservice.lab7;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import com.shop.orderservice.product.ProductController;
import com.shop.orderservice.product.ProductDtos.ProductResponse;
import com.shop.orderservice.product.ProductService;
import com.shop.orderservice.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/** Our own SecurityFilterChain rules on the web slice; the service layer is a mock. */
@WebMvcTest(ProductController.class)
@Import(SecurityConfig.class)
class SecurityRulesWebMvcTest {

    static final String BODY = """
            {"name": "Keyboard", "price": 90.00, "stock": 10}""";

    @Autowired
    MockMvc mvc;

    @MockitoBean
    ProductService productService;

    @Test
    void anonymousCanReadProducts() throws Exception {
        given(productService.findById(1L))
                .willReturn(new ProductResponse(1L, "Keyboard", new BigDecimal("100.00"), 10));
        mvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Keyboard"));
    }

    @Test
    void writeWithoutTokenIs401() throws Exception {
        MvcResult r = mvc.perform(put("/products/1")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andReturn();
        System.out.println("LAB7 no token: " + r.getResponse().getStatus()
                + " WWW-Authenticate=" + r.getResponse().getHeader("WWW-Authenticate"));
    }

    @Test
    void userRoleCannotUpdateProduct403() throws Exception {
        MvcResult r = mvc.perform(put("/products/1")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden())
                .andReturn();
        System.out.println("LAB7 USER: " + r.getResponse().getStatus()
                + " WWW-Authenticate=" + r.getResponse().getHeader("WWW-Authenticate"));
    }

    @Test
    void adminRoleCanUpdateProduct() throws Exception {
        given(productService.update(eq(1L), any()))
                .willReturn(new ProductResponse(1L, "Keyboard", new BigDecimal("90.00"), 10));
        mvc.perform(put("/products/1")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(90.00));
    }
}
