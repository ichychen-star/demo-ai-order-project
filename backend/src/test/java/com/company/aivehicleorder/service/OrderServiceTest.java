package com.company.aivehicleorder.service;

import com.company.aivehicleorder.dto.request.CreateOrderRequest;
import com.company.aivehicleorder.dto.response.OrderResponse;
import com.company.aivehicleorder.entity.Order;
import com.company.aivehicleorder.entity.Vehicle;
import com.company.aivehicleorder.entity.VehicleOption;
import com.company.aivehicleorder.exception.EntityNotFoundException;
import com.company.aivehicleorder.pricing.PriceCalculator.PriceCalculationResult;
import com.company.aivehicleorder.repository.OrderRepository;
import com.company.aivehicleorder.repository.VehicleOptionRepository;
import com.company.aivehicleorder.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private VehicleOptionRepository vehicleOptionRepository;
    @Mock private PricingService pricingService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, vehicleRepository, vehicleOptionRepository, pricingService);
    }

    // ── createOrder ──────────────────────────────────────────────────────────

    @Test
    void createOrder_persistsWithCorrectTotalPriceAndOptionSnapshots() {
        UUID vehicleId = UUID.randomUUID();
        UUID optId1 = UUID.randomUUID();
        UUID optId2 = UUID.randomUUID();

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("陳小明");
        req.setCustomerPhone("0912345678");
        req.setVehicleId(vehicleId);
        req.setExteriorColor("白色");
        req.setInteriorColor("黑色");
        req.setExpectedDeliveryMonth("2026-08");
        req.setStatus("DRAFT");
        req.setOptionIds(List.of(optId1, optId2));

        Vehicle vehicle = new Vehicle(vehicleId, "Toyota", "Camry", new BigDecimal("1000000"), true, null);
        VehicleOption opt1 = new VehicleOption(optId1, "天窗", new BigDecimal("50000"), true, null);
        VehicleOption opt2 = new VehicleOption(optId2, "倒車攝影", new BigDecimal("30000"), true, null);

        PriceCalculationResult priceResult = new PriceCalculationResult(
                new BigDecimal("1000000"), new BigDecimal("80000"), new BigDecimal("1080000"));

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(vehicleOptionRepository.findAllById(List.of(optId1, optId2))).thenReturn(List.of(opt1, opt2));
        when(pricingService.calculate(any(), any())).thenReturn(priceResult);
        when(orderRepository.countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(0L);

        Order savedOrder = buildSavedOrder(vehicleId, vehicle, priceResult);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        orderService.createOrder(req);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        Order captured = captor.getValue();

        assertThat(captured.getTotalPrice()).isEqualByComparingTo(new BigDecimal("1080000"));
        assertThat(captured.getVehicleBasePrice()).isEqualByComparingTo(new BigDecimal("1000000"));
        assertThat(captured.getOptionsTotalPrice()).isEqualByComparingTo(new BigDecimal("80000"));
        assertThat(captured.getOrderNo()).isNotBlank();
        assertThat(captured.getOptions()).hasSize(2);
        // option_name and option_price snapshots
        assertThat(captured.getOptions()).allSatisfy(oo -> assertThat(oo.getOptionPrice()).isNotNull());
        assertThat(captured.getOptions()).allSatisfy(oo -> assertThat(oo.getOptionName()).isNotBlank());
    }

    // ── deleteOrder ──────────────────────────────────────────────────────────

    @Test
    void deleteOrder_setsDeletedTrueWithoutRemovingRecord() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setDeleted(false);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        orderService.deleteOrder(orderId);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertThat(captor.getValue().isDeleted()).isTrue();
        verify(orderRepository, never()).deleteById(any());
        verify(orderRepository, never()).delete(any());
    }

    @Test
    void deleteOrder_alreadyDeleted_throwsEntityNotFoundException() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setDeleted(true);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.deleteOrder(orderId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ── listOrders ───────────────────────────────────────────────────────────

    @Test
    void listOrders_withNoFilters_queriesDeletedFalseMethod() {
        when(orderRepository.findByDeletedFalseAndStatusContainingAndCustomerNameContaining("", ""))
                .thenReturn(List.of());

        List<OrderResponse> result = orderService.listOrders(null, null);

        verify(orderRepository).findByDeletedFalseAndStatusContainingAndCustomerNameContaining("", "");
        assertThat(result).isEmpty();
    }

    @Test
    void listOrders_withKeywordAndStatus_passesFiltersToRepository() {
        when(orderRepository.findByDeletedFalseAndStatusContainingAndCustomerNameContaining("DRAFT", "陳"))
                .thenReturn(List.of());

        orderService.listOrders("陳", "DRAFT");

        verify(orderRepository).findByDeletedFalseAndStatusContainingAndCustomerNameContaining("DRAFT", "陳");
    }

    // ── getOrder ─────────────────────────────────────────────────────────────

    @Test
    void getOrder_notFound_throwsEntityNotFoundException() {
        UUID id = UUID.randomUUID();
        when(orderRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrder(id))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getOrder_deletedOrder_throwsEntityNotFoundException() {
        UUID id = UUID.randomUUID();
        Order deleted = new Order();
        deleted.setId(id);
        deleted.setDeleted(true);

        when(orderRepository.findById(id)).thenReturn(Optional.of(deleted));

        assertThatThrownBy(() -> orderService.getOrder(id))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Order buildSavedOrder(UUID vehicleId, Vehicle vehicle, PriceCalculationResult price) {
        Order saved = new Order();
        saved.setId(UUID.randomUUID());
        saved.setOrderNo("ORD-20260517-0001");
        saved.setCustomerName("陳小明");
        saved.setCustomerPhone("0912345678");
        saved.setVehicle(vehicle);
        saved.setExteriorColor("白色");
        saved.setInteriorColor("黑色");
        saved.setExpectedDeliveryMonth("2026-08");
        saved.setStatus("DRAFT");
        saved.setVehicleBasePrice(price.vehicleBasePrice());
        saved.setOptionsTotalPrice(price.optionsTotalPrice());
        saved.setTotalPrice(price.totalPrice());
        saved.setCreatedAt(LocalDateTime.now());
        saved.setUpdatedAt(LocalDateTime.now());
        return saved;
    }
}
