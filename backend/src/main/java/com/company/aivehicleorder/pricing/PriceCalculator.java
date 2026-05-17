package com.company.aivehicleorder.pricing;

import java.math.BigDecimal;
import java.util.List;

public final class PriceCalculator {

    private PriceCalculator() {}

    public record PriceCalculationResult(
            BigDecimal vehicleBasePrice,
            BigDecimal optionsTotalPrice,
            BigDecimal totalPrice
    ) {}

    public static PriceCalculationResult calculate(BigDecimal basePrice, List<BigDecimal> optionPrices) {
        BigDecimal optionsTotal = optionPrices.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PriceCalculationResult(basePrice, optionsTotal, basePrice.add(optionsTotal));
    }
}
