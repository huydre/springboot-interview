package com.shop.orderservice.customer;

import java.net.URI;

import com.shop.orderservice.common.ResourceNotFoundException;
import com.shop.orderservice.customer.CustomerDtos.CreateCustomerRequest;
import com.shop.orderservice.customer.CustomerDtos.CustomerResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Minimal customer API: just enough to create orders. */
@RestController
@RequestMapping("/customers")
public class CustomerController {

    private final CustomerRepository customers;

    public CustomerController(CustomerRepository customers) {
        this.customers = customers;
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest req) {
        Customer saved = customers.save(new Customer(req.name(), req.email()));
        return ResponseEntity.created(URI.create("/customers/" + saved.getId()))
                .body(CustomerResponse.from(saved));
    }

    @GetMapping("/{id}")
    public CustomerResponse get(@PathVariable Long id) {
        return customers.findById(id)
                .map(CustomerResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }
}
