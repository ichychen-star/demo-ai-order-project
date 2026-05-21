package com.company.aivehicleorder.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AiGenerateRequest {

    @NotNull
    private UUID orderId;
}
