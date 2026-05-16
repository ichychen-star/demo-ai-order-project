package com.company.aivehicleorder.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponse {

    private UUID id;
    private String brand;
    private String model;
    private BigDecimal basePrice;
}
