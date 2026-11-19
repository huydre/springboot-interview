package com.shop.orderservice.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class CustomerDtos {

    private CustomerDtos() {
    }

    public record CreateCustomerRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 200) String email) {
    }

    public record CustomerResponse(Long id, String name, String email) {

        public static CustomerResponse from(Customer c) {
            return new CustomerResponse(c.getId(), c.getName(), c.getEmail());
        }
    }
}
