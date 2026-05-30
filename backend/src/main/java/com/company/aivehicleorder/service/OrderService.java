package com.company.aivehicleorder.service;

import com.company.aivehicleorder.dto.request.CreateOrderRequest;
import com.company.aivehicleorder.dto.request.UpdateOrderRequest;
import com.company.aivehicleorder.dto.response.OrderResponse;
import com.company.aivehicleorder.entity.Order;
import com.company.aivehicleorder.entity.OrderOption;
import com.company.aivehicleorder.entity.OrderOptionId;
import com.company.aivehicleorder.entity.Vehicle;
import com.company.aivehicleorder.entity.VehicleOption;
import com.company.aivehicleorder.exception.EntityNotFoundException;
import com.company.aivehicleorder.mapper.OrderMapper;
import com.company.aivehicleorder.pricing.PriceCalculator.PriceCalculationResult;
import com.company.aivehicleorder.repository.OrderRepository;
import com.company.aivehicleorder.repository.VehicleOptionRepository;
import com.company.aivehicleorder.repository.VehicleRepository;
import com.company.aivehicleorder.util.OrderNoGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleOptionRepository vehicleOptionRepository;
    private final PricingService pricingService;

    public OrderService(OrderRepository orderRepository,
                        VehicleRepository vehicleRepository,
                        VehicleOptionRepository vehicleOptionRepository,
                        PricingService pricingService) {
        this.orderRepository = orderRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleOptionRepository = vehicleOptionRepository;
        this.pricingService = pricingService;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req) {
        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + req.getVehicleId()));

        List<UUID> optionIds = req.getOptionIds() != null ? req.getOptionIds() : List.of();
        List<VehicleOption> options = vehicleOptionRepository.findAllById(optionIds);

        List<BigDecimal> optionPrices = options.stream().map(VehicleOption::getPrice).toList();
        PriceCalculationResult price = pricingService.calculate(vehicle.getBasePrice(), optionPrices);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long todayCount = orderRepository.countByCreatedAtBetween(startOfDay, startOfDay.plusDays(1));
        String orderNo = OrderNoGenerator.generate(LocalDate.now(), todayCount);

        Order order = OrderMapper.toEntity(req, vehicle, options);
        order.setOrderNo(orderNo);
        order.setVehicleBasePrice(price.vehicleBasePrice());
        order.setOptionsTotalPrice(price.optionsTotalPrice());
        order.setTotalPrice(price.totalPrice());

        log.info("Price calc: vehicleId={}, options={}, total={}", vehicle.getId(), options.size(), price.totalPrice());

        return OrderMapper.toResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID id) {
        return orderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .map(OrderMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listOrders(String keyword, String status) {
        String kw = keyword != null ? keyword : "";
        String st = status != null ? status : "";
        return orderRepository.findByDeletedFalseAndStatusContainingAndCustomerNameContaining(st, kw, Sort.by(Sort.Direction.DESC, "orderNo"))
                .stream()
                .map(OrderMapper::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse updateOrder(UUID id, UpdateOrderRequest req) {
        Order order = orderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + id));

        if (req.getCustomerName() != null) order.setCustomerName(req.getCustomerName());
        if (req.getCustomerPhone() != null) order.setCustomerPhone(req.getCustomerPhone());
        if (req.getCustomerEmail() != null) order.setCustomerEmail(req.getCustomerEmail());
        if (req.getExteriorColor() != null) order.setExteriorColor(req.getExteriorColor());
        if (req.getInteriorColor() != null) order.setInteriorColor(req.getInteriorColor());
        if (req.getExpectedDeliveryMonth() != null) order.setExpectedDeliveryMonth(req.getExpectedDeliveryMonth());
        if (req.getStatus() != null) order.setStatus(req.getStatus());

        boolean vehicleChanged = req.getVehicleId() != null;
        boolean optionsChanged = req.getOptionIds() != null;

        if (vehicleChanged || optionsChanged) {
            Vehicle vehicle = vehicleChanged
                    ? vehicleRepository.findById(req.getVehicleId())
                            .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + req.getVehicleId()))
                    : order.getVehicle();

            if (vehicleChanged) {
                order.setVehicle(vehicle);
            }

            List<BigDecimal> optionPrices;
            if (optionsChanged) {
                List<VehicleOption> newOptions = vehicleOptionRepository.findAllById(req.getOptionIds());
                order.getOptions().clear();
                newOptions.forEach(opt -> {
                    OrderOptionId optId = new OrderOptionId(order.getId(), opt.getId());
                    order.getOptions().add(new OrderOption(optId, order, opt, opt.getName(), opt.getPrice()));
                });
                optionPrices = newOptions.stream().map(VehicleOption::getPrice).toList();
            } else {
                optionPrices = order.getOptions().stream().map(OrderOption::getOptionPrice).toList();
            }

            PriceCalculationResult price = pricingService.calculate(vehicle.getBasePrice(), optionPrices);
            order.setVehicleBasePrice(price.vehicleBasePrice());
            order.setOptionsTotalPrice(price.optionsTotalPrice());
            order.setTotalPrice(price.totalPrice());
            log.info("Price calc: vehicleId={}, options={}, total={}", vehicle.getId(), optionPrices.size(), price.totalPrice());
        }

        return OrderMapper.toResponse(orderRepository.save(order));
    }

    @Transactional
    public void deleteOrder(UUID id) {
        Order order = orderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + id));
        order.setDeleted(true);
        orderRepository.save(order);
    }

    @Transactional
    public void updateAiSummary(UUID orderId, String aiSummary) {
        Order order = orderRepository.findById(orderId)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));
        order.setAiSummary(aiSummary);
        orderRepository.save(order);
        log.info("Updated AI summary for order: {}", orderId);
    }

}
