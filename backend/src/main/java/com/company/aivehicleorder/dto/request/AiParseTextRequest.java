package com.company.aivehicleorder.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiParseTextRequest {

    @NotBlank
    @Size(max = 2000)
    private String sourceText;
}
