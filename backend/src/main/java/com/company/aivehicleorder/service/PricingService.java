package com.company.aivehicleorder.service;

import com.company.aivehicleorder.entity.VehicleOption;
import com.company.aivehicleorder.exception.EntityNotFoundException;
import com.company.aivehicleorder.pricing.PriceCalculator;
import com.company.aivehicleorder.pricing.PriceCalculator.PriceCalculationResult;
import com.company.aivehicleorder.repository.VehicleOptionRepository;
import com.company.aivehicleorder.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class PricingService {

    private static final Logger log = LoggerFactory.getLogger(PricingService.class);

    private final VehicleRepository vehicleRepository;
    private final VehicleOptionRepository vehicleOptionRepository;

    public PricingService(VehicleRepository vehicleRepository, VehicleOptionRepository vehicleOptionRepository) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleOptionRepository = vehicleOptionRepository;
    }

    public PriceCalculationResult calculate(BigDecimal basePrice, List<BigDecimal> optionPrices) {
        return PriceCalculator.calculate(basePrice, optionPrices);
    }

    public PriceCalculationResult calculateFromIds(UUID vehicleId, List<UUID> optionIds) {
        var vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + vehicleId));

        List<VehicleOption> options = vehicleOptionRepository.findAllById(optionIds);
        List<BigDecimal> optionPrices = options.stream()
                .map(VehicleOption::getPrice)
                .toList();

        PriceCalculationResult result = PriceCalculator.calculate(vehicle.getBasePrice(), optionPrices);
        log.info("Price calc: vehicleId={}, options={}, total={}", vehicleId, options.size(), result.totalPrice());
        return result;
    }
}
