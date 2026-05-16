package com.company.aivehicleorder.mapper;

import com.company.aivehicleorder.dto.request.CreateOrderRequest;
import com.company.aivehicleorder.dto.response.OrderResponse;
import com.company.aivehicleorder.dto.response.VehicleOptionResponse;
import com.company.aivehicleorder.dto.response.VehicleResponse;
import com.company.aivehicleorder.entity.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MapperTest {

    // ── helpers ──────────────────────────────────────────────────────────────

    private Vehicle buildVehicle() {
        Vehicle v = new Vehicle();
        v.setId(UUID.randomUUID());
        v.setBrand("Mercedes-Benz");
        v.setModel("GLC 300 Coupe");
        v.setBasePrice(new BigDecimal("3450000"));
        v.setActive(true);
        v.setCreatedAt(LocalDateTime.now());
        return v;
    }

    private VehicleOption buildVehicleOption(String name, BigDecimal price) {
        VehicleOption opt = new VehicleOption();
        opt.setId(UUID.randomUUID());
        opt.setName(name);
        opt.setPrice(price);
        opt.setActive(true);
        opt.setCreatedAt(LocalDateTime.now());
        return opt;
    }

    private Order buildOrder(Vehicle vehicle) {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setOrderNo("ORD-20260101-0001");
        order.setCustomerName("林俊賢");
        order.setCustomerPhone("0912-000-000");
        order.setCustomerEmail("lin@example.com");
        order.setVehicle(vehicle);
        order.setExteriorColor("曜石黑");
        order.setInteriorColor("黑色皮革");
        order.setVehicleBasePrice(new BigDecimal("3450000"));
        order.setOptionsTotalPrice(new BigDecimal("180000"));
        order.setTotalPrice(new BigDecimal("3630000"));
        order.setExpectedDeliveryMonth("2026-08");
        order.setStatus("DRAFT");
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return order;
    }

    // ── OrderMapper.toResponse ───────────────────────────────────────────────

    @Test
    void toResponse_mapsAllScalarFields() {
        Vehicle vehicle = buildVehicle();
        Order order = buildOrder(vehicle);

        OrderResponse response = OrderMapper.toResponse(order);

        assertThat(response.getId()).isEqualTo(order.getId());
        assertThat(response.getOrderNo()).isEqualTo("ORD-20260101-0001");
        assertThat(response.getCustomerName()).isEqualTo("林俊賢");
        assertThat(response.getCustomerPhone()).isEqualTo("0912-000-000");
        assertThat(response.getCustomerEmail()).isEqualTo("lin@example.com");
        assertThat(response.getExteriorColor()).isEqualTo("曜石黑");
        assertThat(response.getInteriorColor()).isEqualTo("黑色皮革");
        assertThat(response.getVehicleBasePrice()).isEqualByComparingTo("3450000");
        assertThat(response.getOptionsTotalPrice()).isEqualByComparingTo("180000");
        assertThat(response.getTotalPrice()).isEqualByComparingTo("3630000");
        assertThat(response.getExpectedDeliveryMonth()).isEqualTo("2026-08");
        assertThat(response.getStatus()).isEqualTo("DRAFT");
        assertThat(response.isDeleted()).isFalse();
        assertThat(response.getCreatedAt()).isNotNull();
        assertThat(response.getUpdatedAt()).isNotNull();
    }

    @Test
    void toResponse_vehicleNameIsBrandPlusModel() {
        Vehicle vehicle = buildVehicle();
        Order order = buildOrder(vehicle);

        OrderResponse response = OrderMapper.toResponse(order);

        assertThat(response.getVehicleId()).isEqualTo(vehicle.getId());
        assertThat(response.getVehicleName()).isEqualTo("Mercedes-Benz GLC 300 Coupe");
    }

    @Test
    void toResponse_nestedOptionsAreMapped() {
        Vehicle vehicle = buildVehicle();
        Order order = buildOrder(vehicle);

        VehicleOption opt = buildVehicleOption("AMG Line", new BigDecimal("180000"));
        OrderOptionId optId = new OrderOptionId(order.getId(), opt.getId());
        order.getOptions().add(new OrderOption(optId, order, opt, "AMG Line", new BigDecimal("180000")));

        OrderResponse response = OrderMapper.toResponse(order);

        assertThat(response.getOptions()).hasSize(1);
        assertThat(response.getOptions().get(0).getOptionId()).isEqualTo(opt.getId());
        assertThat(response.getOptions().get(0).getOptionName()).isEqualTo("AMG Line");
        assertThat(response.getOptions().get(0).getOptionPrice()).isEqualByComparingTo("180000");
    }

    @Test
    void toResponse_emptyOptionsList() {
        Order order = buildOrder(buildVehicle());

        OrderResponse response = OrderMapper.toResponse(order);

        assertThat(response.getOptions()).isEmpty();
    }

    // ── OrderMapper.toEntity ─────────────────────────────────────────────────

    @Test
    void toEntity_setsNonPriceFields() {
        Vehicle vehicle = buildVehicle();
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("陳美玲");
        req.setCustomerPhone("0923-111-111");
        req.setCustomerEmail("chen@example.com");
        req.setVehicleId(vehicle.getId());
        req.setExteriorColor("白色");
        req.setInteriorColor("米色");
        req.setExpectedDeliveryMonth("2026-09");
        req.setStatus("DRAFT");

        Order order = OrderMapper.toEntity(req, vehicle, List.of());

        assertThat(order.getCustomerName()).isEqualTo("陳美玲");
        assertThat(order.getCustomerPhone()).isEqualTo("0923-111-111");
        assertThat(order.getCustomerEmail()).isEqualTo("chen@example.com");
        assertThat(order.getVehicle()).isEqualTo(vehicle);
        assertThat(order.getExteriorColor()).isEqualTo("白色");
        assertThat(order.getInteriorColor()).isEqualTo("米色");
        assertThat(order.getExpectedDeliveryMonth()).isEqualTo("2026-09");
        assertThat(order.getStatus()).isEqualTo("DRAFT");
    }

    @Test
    void toEntity_priceFieldsAreNotSetByMapper() {
        Order order = OrderMapper.toEntity(new CreateOrderRequest(), new Vehicle(), null);

        assertThat(order.getVehicleBasePrice()).isNull();
        assertThat(order.getOptionsTotalPrice()).isNull();
        assertThat(order.getTotalPrice()).isNull();
        assertThat(order.getOrderNo()).isNull();
    }

    @Test
    void toEntity_createsOrderOptionSnapshotsFromVehicleOptions() {
        Vehicle vehicle = buildVehicle();
        VehicleOption opt = buildVehicleOption("Burmester 音響", new BigDecimal("90000"));
        CreateOrderRequest req = new CreateOrderRequest();
        req.setStatus("DRAFT");

        Order order = OrderMapper.toEntity(req, vehicle, List.of(opt));

        assertThat(order.getOptions()).hasSize(1);
        assertThat(order.getOptions().get(0).getOptionName()).isEqualTo("Burmester 音響");
        assertThat(order.getOptions().get(0).getOptionPrice()).isEqualByComparingTo("90000");
        assertThat(order.getOptions().get(0).getId().getOptionId()).isEqualTo(opt.getId());
    }

    // ── VehicleMapper ────────────────────────────────────────────────────────

    @Test
    void vehicleMapper_toResponse_mapsAllFields() {
        Vehicle vehicle = buildVehicle();

        VehicleResponse response = VehicleMapper.toResponse(vehicle);

        assertThat(response.getId()).isEqualTo(vehicle.getId());
        assertThat(response.getBrand()).isEqualTo("Mercedes-Benz");
        assertThat(response.getModel()).isEqualTo("GLC 300 Coupe");
        assertThat(response.getBasePrice()).isEqualByComparingTo("3450000");
    }

    // ── VehicleOptionMapper ──────────────────────────────────────────────────

    @Test
    void vehicleOptionMapper_toResponse_mapsAllFields() {
        VehicleOption opt = buildVehicleOption("夜色套件", new BigDecimal("120000"));

        VehicleOptionResponse response = VehicleOptionMapper.toResponse(opt);

        assertThat(response.getId()).isEqualTo(opt.getId());
        assertThat(response.getName()).isEqualTo("夜色套件");
        assertThat(response.getPrice()).isEqualByComparingTo("120000");
    }
}
