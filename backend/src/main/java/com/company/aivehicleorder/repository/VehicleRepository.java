package com.company.aivehicleorder.repository;

import com.company.aivehicleorder.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    List<Vehicle> findAllByActiveTrueOrderByBrandAscModelAsc();
}
