package com.company.aivehicleorder.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CalculatePriceRequest {

    @NotNull
    private UUID vehicleId;

    private List<UUID> optionIds;
}
