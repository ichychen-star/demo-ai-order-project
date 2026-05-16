package com.company.aivehicleorder.mapper;

import com.company.aivehicleorder.dto.response.VehicleResponse;
import com.company.aivehicleorder.entity.Vehicle;

public class VehicleMapper {

    private VehicleMapper() {}

    public static VehicleResponse toResponse(Vehicle v) {
        return VehicleResponse.builder()
                .id(v.getId())
                .brand(v.getBrand())
                .model(v.getModel())
                .basePrice(v.getBasePrice())
                .build();
    }
}
