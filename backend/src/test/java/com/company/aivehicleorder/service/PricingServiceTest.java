package com.company.aivehicleorder.service;

import com.company.aivehicleorder.pricing.PriceCalculator;
import com.company.aivehicleorder.pricing.PriceCalculator.PriceCalculationResult;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PricingServiceTest {

    @Test
    void calculate_withOptions_returnsSummedTotal() {
        PriceCalculationResult result = PriceCalculator.calculate(
                new BigDecimal("3450000"),
                List.of(new BigDecimal("180000"), new BigDecimal("120000"))
        );

        assertThat(result.vehicleBasePrice()).isEqualByComparingTo(new BigDecimal("3450000"));
        assertThat(result.optionsTotalPrice()).isEqualByComparingTo(new BigDecimal("300000"));
        assertThat(result.totalPrice()).isEqualByComparingTo(new BigDecimal("3750000"));
    }

    @Test
    void calculate_withNoOptions_returnsBasePriceAsTotal() {
        PriceCalculationResult result = PriceCalculator.calculate(
                new BigDecimal("2780000"),
                List.of()
        );

        assertThat(result.vehicleBasePrice()).isEqualByComparingTo(new BigDecimal("2780000"));
        assertThat(result.optionsTotalPrice()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.totalPrice()).isEqualByComparingTo(new BigDecimal("2780000"));
    }

    @Test
    void calculate_noIoInPriceCalculator_pureArithmetic() {
        // PriceCalculator has no Spring context — instantiating here proves it needs no I/O
        PriceCalculationResult result = PriceCalculator.calculate(
                new BigDecimal("1000000"),
                List.of(new BigDecimal("50000"))
        );
        assertThat(result.totalPrice()).isEqualByComparingTo(new BigDecimal("1050000"));
    }
}
