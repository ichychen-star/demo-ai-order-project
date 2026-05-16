package com.company.aivehicleorder.dto;

import com.company.aivehicleorder.dto.request.AiParseTextRequest;
import com.company.aivehicleorder.dto.request.CalculatePriceRequest;
import com.company.aivehicleorder.dto.request.CreateOrderRequest;
import com.company.aivehicleorder.dto.response.AiParseResponse;
import com.company.aivehicleorder.dto.response.OrderResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class DtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    // ── CreateOrderRequest ───────────────────────────────────────────────────

    @Test
    void createOrderRequest_valid_noViolations() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("林俊賢");
        req.setCustomerPhone("0912-000-000");
        req.setVehicleId(UUID.randomUUID());
        req.setExteriorColor("曜石黑");
        req.setInteriorColor("黑色皮革");
        req.setExpectedDeliveryMonth("2026-08");
        req.setStatus("DRAFT");

        assertThat(validator.validate(req)).isEmpty();
    }

    @Test
    void createOrderRequest_missingRequiredFields_hasViolations() {
        CreateOrderRequest req = new CreateOrderRequest();

        Set<ConstraintViolation<CreateOrderRequest>> violations = validator.validate(req);

        assertThat(violations).isNotEmpty();
        var violatedFields = violations.stream()
                .map(v -> v.getPropertyPath().toString())
                .toList();
        assertThat(violatedFields).contains("customerName", "customerPhone",
                "vehicleId", "exteriorColor", "interiorColor",
                "expectedDeliveryMonth", "status");
    }

    @Test
    void createOrderRequest_optionalEmailAndOptions_noViolation() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("林俊賢");
        req.setCustomerPhone("0912-000-000");
        req.setVehicleId(UUID.randomUUID());
        req.setExteriorColor("白色");
        req.setInteriorColor("米色");
        req.setExpectedDeliveryMonth("2026-08");
        req.setStatus("DRAFT");
        // customerEmail and optionIds intentionally null

        assertThat(validator.validate(req)).isEmpty();
    }

    // ── AiParseTextRequest ───────────────────────────────────────────────────

    @Test
    void aiParseTextRequest_exceedsMaxSize_hasViolation() {
        AiParseTextRequest req = new AiParseTextRequest();
        req.setSourceText("a".repeat(2001));

        Set<ConstraintViolation<AiParseTextRequest>> violations = validator.validate(req);

        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("sourceText");
    }

    @Test
    void aiParseTextRequest_atMaxSize_noViolation() {
        AiParseTextRequest req = new AiParseTextRequest();
        req.setSourceText("a".repeat(2000));

        assertThat(validator.validate(req)).isEmpty();
    }

    @Test
    void aiParseTextRequest_blank_hasViolation() {
        AiParseTextRequest req = new AiParseTextRequest();
        req.setSourceText("   ");

        assertThat(validator.validate(req)).isNotEmpty();
    }

    // ── CalculatePriceRequest ────────────────────────────────────────────────

    @Test
    void calculatePriceRequest_nullVehicleId_hasViolation() {
        CalculatePriceRequest req = new CalculatePriceRequest();

        Set<ConstraintViolation<CalculatePriceRequest>> violations = validator.validate(req);

        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("vehicleId");
    }

    // ── AiParseResponse — fields match SPEC §17.2 ───────────────────────────

    @Test
    void aiParseResponse_buildsWithAllSpec172Fields() {
        AiParseResponse response = AiParseResponse.builder()
                .customerName("王先生")
                .customerPhone("0912-xxx-xxx")
                .customerEmail("wang@example.com")
                .brand("Mercedes-Benz")
                .model("GLC 300 Coupe")
                .exteriorColor("白色")
                .interiorColor("黑色")
                .options(List.of("AMG Line", "夜色套件"))
                .expectedDeliveryMonth("2026-06")
                .confidence(0.92)
                .missingFields(List.of())
                .build();

        assertThat(response.getCustomerName()).isEqualTo("王先生");
        assertThat(response.getBrand()).isEqualTo("Mercedes-Benz");
        assertThat(response.getOptions()).containsExactly("AMG Line", "夜色套件");
        assertThat(response.getConfidence()).isEqualTo(0.92);
        assertThat(response.getMissingFields()).isEmpty();
    }

    // ── OrderResponse — builder includes vehicleName and nested options ───────

    @Test
    void orderResponse_builderIncludesVehicleNameAndOptions() {
        OrderResponse response = OrderResponse.builder()
                .orderNo("ORD-20260101-0001")
                .vehicleName("Mercedes-Benz GLC 300 Coupe")
                .status("DRAFT")
                .options(List.of())
                .build();

        assertThat(response.getVehicleName()).isEqualTo("Mercedes-Benz GLC 300 Coupe");
        assertThat(response.getOptions()).isEmpty();
    }
}
