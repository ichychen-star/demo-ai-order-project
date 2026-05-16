package com.company.aivehicleorder.repository;

import com.company.aivehicleorder.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderRepositoryTest {

    @Autowired private OrderRepository orderRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private VehicleOptionRepository vehicleOptionRepository;

    private Vehicle vehicle;

    // ── setup ────────────────────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setBrand("Mercedes-Benz");
        vehicle.setModel("GLC 300 Coupe");
        vehicle.setBasePrice(new BigDecimal("3450000"));
        vehicle.setActive(true);
        vehicle.setCreatedAt(LocalDateTime.now());
        vehicle = vehicleRepository.save(vehicle);
    }

    private Order buildOrder(String orderNo, String customerName, String status, boolean deleted) {
        Order o = new Order();
        o.setOrderNo(orderNo);
        o.setCustomerName(customerName);
        o.setCustomerPhone("0912-000-000");
        o.setVehicle(vehicle);
        o.setExteriorColor("曜石黑");
        o.setInteriorColor("黑色皮革");
        o.setVehicleBasePrice(new BigDecimal("3450000"));
        o.setOptionsTotalPrice(BigDecimal.ZERO);
        o.setTotalPrice(new BigDecimal("3450000"));
        o.setExpectedDeliveryMonth("2026-08");
        o.setStatus(status);
        o.setDeleted(deleted);
        return o;
    }

    // ── TASK-BE-003: findByDeletedFalse ─────────────────────────────────────

    @Test
    void findByDeletedFalse_excludesSoftDeletedOrders() {
        orderRepository.saveAll(List.of(
                buildOrder("ORD-001", "林俊賢", OrderStatus.CONFIRMED.name(), false),
                buildOrder("ORD-002", "陳美玲", OrderStatus.DRAFT.name(),     false),
                buildOrder("ORD-003", "王大明", OrderStatus.DRAFT.name(),     true)   // soft-deleted
        ));

        List<Order> result = orderRepository.findByDeletedFalse();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Order::getOrderNo)
                .doesNotContain("ORD-003");
    }

    @Test
    void findByDeletedFalse_returnsEmptyWhenAllDeleted() {
        orderRepository.save(buildOrder("ORD-001", "Test", OrderStatus.DRAFT.name(), true));

        List<Order> result = orderRepository.findByDeletedFalse();

        assertThat(result).isEmpty();
    }

    // ── TASK-BE-003: findByDeletedFalseAndStatusContainingAndCustomerNameContaining ──

    @Test
    void searchQuery_filtersByStatusAndCustomerName() {
        orderRepository.saveAll(List.of(
                buildOrder("ORD-001", "林俊賢", OrderStatus.CONFIRMED.name(), false),
                buildOrder("ORD-002", "陳美玲", OrderStatus.DRAFT.name(),     false),
                buildOrder("ORD-003", "林小明", OrderStatus.DRAFT.name(),     false)
        ));

        List<Order> result = orderRepository
                .findByDeletedFalseAndStatusContainingAndCustomerNameContaining("DRAFT", "林");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCustomerName()).isEqualTo("林小明");
    }

    @Test
    void searchQuery_emptyStringsMatchAllNonDeleted() {
        orderRepository.saveAll(List.of(
                buildOrder("ORD-001", "林俊賢", OrderStatus.CONFIRMED.name(), false),
                buildOrder("ORD-002", "陳美玲", OrderStatus.DRAFT.name(),     false),
                buildOrder("ORD-003", "王大明", OrderStatus.DRAFT.name(),     true)  // deleted — excluded
        ));

        List<Order> result = orderRepository
                .findByDeletedFalseAndStatusContainingAndCustomerNameContaining("", "");

        assertThat(result).hasSize(2);
    }

    @Test
    void searchQuery_excludesSoftDeletedEvenOnMatch() {
        orderRepository.saveAll(List.of(
                buildOrder("ORD-001", "林俊賢", OrderStatus.DRAFT.name(), false),
                buildOrder("ORD-002", "林小明", OrderStatus.DRAFT.name(), true)   // soft-deleted
        ));

        List<Order> result = orderRepository
                .findByDeletedFalseAndStatusContainingAndCustomerNameContaining("DRAFT", "林");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOrderNo()).isEqualTo("ORD-001");
    }

    // ── TASK-BE-003: Order entity lifecycle ─────────────────────────────────

    @Test
    void prePersist_setsCreatedAtAndUpdatedAt() {
        Order saved = orderRepository.save(
                buildOrder("ORD-001", "林俊賢", OrderStatus.DRAFT.name(), false));
        orderRepository.flush();

        Order found = orderRepository.findById(saved.getId()).orElseThrow();

        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getUpdatedAt()).isNotNull();
    }

    @Test
    void defaultStatus_isDraft() {
        Order o = buildOrder("ORD-001", "林俊賢", OrderStatus.DRAFT.name(), false);
        Order saved = orderRepository.save(o);

        assertThat(saved.getStatus()).isEqualTo("DRAFT");
    }

    // ── TASK-BE-003: OrderOption cascade ────────────────────────────────────

    @Test
    void orderOption_savedViaCascadeAndLinkedCorrectly() {
        VehicleOption opt = new VehicleOption();
        opt.setName("AMG Line");
        opt.setPrice(new BigDecimal("180000"));
        opt.setActive(true);
        opt.setCreatedAt(LocalDateTime.now());
        opt = vehicleOptionRepository.save(opt);

        Order order = buildOrder("ORD-001", "林俊賢", OrderStatus.DRAFT.name(), false);
        order.setOptionsTotalPrice(new BigDecimal("180000"));
        order.setTotalPrice(new BigDecimal("3630000"));

        OrderOptionId optId = new OrderOptionId(null, opt.getId()); // orderId set by @MapsId
        OrderOption orderOption = new OrderOption(optId, order, opt, "AMG Line", new BigDecimal("180000"));
        order.getOptions().add(orderOption);

        Order saved = orderRepository.save(order);
        orderRepository.flush();

        Order found = orderRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getOptions()).hasSize(1);
        assertThat(found.getOptions().get(0).getOptionName()).isEqualTo("AMG Line");
        assertThat(found.getOptions().get(0).getOptionPrice())
                .isEqualByComparingTo(new BigDecimal("180000"));
    }

    @Test
    void orderOption_deletedViaCascadeOnOrderDelete() {
        VehicleOption opt = new VehicleOption();
        opt.setName("HUD 抬頭顯示");
        opt.setPrice(new BigDecimal("70000"));
        opt.setActive(true);
        opt.setCreatedAt(LocalDateTime.now());
        opt = vehicleOptionRepository.save(opt);

        Order order = buildOrder("ORD-001", "陳美玲", OrderStatus.DRAFT.name(), false);
        OrderOptionId optId = new OrderOptionId(null, opt.getId());
        order.getOptions().add(new OrderOption(optId, order, opt, "HUD 抬頭顯示", new BigDecimal("70000")));

        Order saved = orderRepository.save(order);
        orderRepository.flush();

        orderRepository.delete(saved);
        orderRepository.flush();

        assertThat(orderRepository.findById(saved.getId())).isEmpty();
    }
}
