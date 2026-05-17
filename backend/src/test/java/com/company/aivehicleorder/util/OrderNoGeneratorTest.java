package com.company.aivehicleorder.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class OrderNoGeneratorTest {

    // ── Acceptance Criteria ──────────────────────────────────────────────────

    @Test
    void generate_firstOrderOfDay_sequenceIs0001() {
        String orderNo = OrderNoGenerator.generate(LocalDate.of(2026, 5, 14), 0);
        assertThat(orderNo).isEqualTo("ORD-20260514-0001");
    }

    @Test
    void generate_sixthOrderOfDay_sequenceIs0006() {
        String orderNo = OrderNoGenerator.generate(LocalDate.of(2026, 5, 14), 5);
        assertThat(orderNo).isEqualTo("ORD-20260514-0006");
    }

    // ── Additional edge cases ────────────────────────────────────────────────

    @Test
    void generate_dateFormattedAsYYYYMMDD() {
        String orderNo = OrderNoGenerator.generate(LocalDate.of(2026, 1, 3), 0);
        assertThat(orderNo).isEqualTo("ORD-20260103-0001");
    }

    @Test
    void generate_sequenceZeroPaddedToFourDigits() {
        String orderNo = OrderNoGenerator.generate(LocalDate.of(2026, 5, 14), 9);
        assertThat(orderNo).startsWith("ORD-20260514-00");
        assertThat(orderNo).endsWith("0010");
    }

    @Test
    void generate_largeCount_sequenceStillFormatted() {
        String orderNo = OrderNoGenerator.generate(LocalDate.of(2026, 5, 14), 999);
        assertThat(orderNo).isEqualTo("ORD-20260514-1000");
    }
}
