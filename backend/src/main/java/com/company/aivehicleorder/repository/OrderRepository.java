package com.company.aivehicleorder.repository;

import com.company.aivehicleorder.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByDeletedFalse();

    List<Order> findByDeletedFalseAndStatusContainingAndCustomerNameContaining(
            String status, String customerName);
}
