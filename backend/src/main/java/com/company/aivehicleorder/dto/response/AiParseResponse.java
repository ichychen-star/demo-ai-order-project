package com.company.aivehicleorder.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiParseResponse {

    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String brand;
    private String model;
    private String exteriorColor;
    private String interiorColor;
    private List<String> options;
    private String expectedDeliveryMonth;
    private Double confidence;
    private List<String> missingFields;
}
