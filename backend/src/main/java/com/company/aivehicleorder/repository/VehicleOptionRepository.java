package com.company.aivehicleorder.repository;

import com.company.aivehicleorder.entity.VehicleOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VehicleOptionRepository extends JpaRepository<VehicleOption, UUID> {
    List<VehicleOption> findAllByActiveTrueOrderByNameAsc();
}
