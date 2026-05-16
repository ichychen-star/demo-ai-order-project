package com.company.aivehicleorder.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateOrderRequest {

    @NotBlank
    private String customerName;

    @NotBlank
    private String customerPhone;

    private String customerEmail;

    @NotNull
    private UUID vehicleId;

    @NotBlank
    private String exteriorColor;

    @NotBlank
    private String interiorColor;

    private List<UUID> optionIds;

    @NotBlank
    private String expectedDeliveryMonth;

    @NotBlank
    private String status;
}
