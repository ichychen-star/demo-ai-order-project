package com.company.aivehicleorder.controller;

import com.company.aivehicleorder.dto.response.VehicleOptionResponse;
import com.company.aivehicleorder.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/options")
@Tag(name = "Options", description = "Vehicle option reference data")
public class OptionController {

    private final VehicleService vehicleService;

    public OptionController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    @Operation(summary = "List all active vehicle options")
    public List<VehicleOptionResponse> listOptions() {
        return vehicleService.listOptions();
    }
}
