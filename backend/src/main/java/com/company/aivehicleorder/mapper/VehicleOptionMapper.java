package com.company.aivehicleorder.mapper;

import com.company.aivehicleorder.dto.response.VehicleOptionResponse;
import com.company.aivehicleorder.entity.VehicleOption;

public class VehicleOptionMapper {

    private VehicleOptionMapper() {}

    public static VehicleOptionResponse toResponse(VehicleOption vo) {
        return VehicleOptionResponse.builder()
                .id(vo.getId())
                .name(vo.getName())
                .price(vo.getPrice())
                .build();
    }
}
