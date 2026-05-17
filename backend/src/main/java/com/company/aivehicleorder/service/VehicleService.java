package com.company.aivehicleorder.service;

import com.company.aivehicleorder.dto.response.VehicleOptionResponse;
import com.company.aivehicleorder.dto.response.VehicleResponse;
import com.company.aivehicleorder.mapper.VehicleMapper;
import com.company.aivehicleorder.mapper.VehicleOptionMapper;
import com.company.aivehicleorder.repository.VehicleOptionRepository;
import com.company.aivehicleorder.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleOptionRepository vehicleOptionRepository;

    public VehicleService(VehicleRepository vehicleRepository, VehicleOptionRepository vehicleOptionRepository) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleOptionRepository = vehicleOptionRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> listVehicles() {
        return vehicleRepository.findAllByActiveTrueOrderByBrandAscModelAsc()
                .stream()
                .map(VehicleMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleOptionResponse> listOptions() {
        return vehicleOptionRepository.findAllByActiveTrueOrderByNameAsc()
                .stream()
                .map(VehicleOptionMapper::toResponse)
                .toList();
    }
}
