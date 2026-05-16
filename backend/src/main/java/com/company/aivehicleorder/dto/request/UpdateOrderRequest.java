package com.company.aivehicleorder.dto.request;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateOrderRequest {

    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private UUID vehicleId;
    private String exteriorColor;
    private String interiorColor;
    private List<UUID> optionIds;
    private String expectedDeliveryMonth;
    private String status;
}
