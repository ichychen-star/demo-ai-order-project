package com.company.aivehicleorder.repository;

import com.company.aivehicleorder.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByDeletedFalse();

    List<Order> findByDeletedFalseAndStatusContainingAndCustomerNameContaining(
            String status, String customerName);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
