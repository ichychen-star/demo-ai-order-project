package com.company.aivehicleorder.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private UUID id;
    private String orderNo;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private UUID vehicleId;
    private String vehicleName;
    private String exteriorColor;
    private String interiorColor;
    private BigDecimal vehicleBasePrice;
    private BigDecimal optionsTotalPrice;
    private BigDecimal totalPrice;
    private String expectedDeliveryMonth;
    private String status;
    private String sourceType;
    private String sourceText;
    private String uploadedFileName;
    private String aiSummary;
    private boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderOptionResponse> options;
}
