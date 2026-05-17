package com.company.aivehicleorder.controller;

import com.company.aivehicleorder.dto.request.CalculatePriceRequest;
import com.company.aivehicleorder.dto.request.CreateOrderRequest;
import com.company.aivehicleorder.dto.request.UpdateOrderRequest;
import com.company.aivehicleorder.dto.response.OrderResponse;
import com.company.aivehicleorder.dto.response.PriceCalculationResponse;
import com.company.aivehicleorder.pricing.PriceCalculator.PriceCalculationResult;
import com.company.aivehicleorder.service.OrderService;
import com.company.aivehicleorder.service.PricingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Order management endpoints")
public class OrderController {

    private final OrderService orderService;
    private final PricingService pricingService;

    public OrderController(OrderService orderService, PricingService pricingService) {
        this.orderService = orderService;
        this.pricingService = pricingService;
    }

    @GetMapping
    @Operation(summary = "List orders with optional keyword and status filter")
    public List<OrderResponse> listOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return orderService.listOrders(keyword, status);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    public OrderResponse getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new order")
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest req) {
        return orderService.createOrder(req);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing order")
    public OrderResponse updateOrder(@PathVariable UUID id,
                                     @Valid @RequestBody UpdateOrderRequest req) {
        return orderService.updateOrder(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Soft-delete an order")
    public void deleteOrder(@PathVariable UUID id) {
        orderService.deleteOrder(id);
    }

    @PostMapping("/calculate-price")
    @Operation(summary = "Calculate price for a vehicle and selected options")
    public PriceCalculationResponse calculatePrice(@Valid @RequestBody CalculatePriceRequest req) {
        List<UUID> optionIds = req.getOptionIds() != null ? req.getOptionIds() : List.of();
        PriceCalculationResult result = pricingService.calculateFromIds(req.getVehicleId(), optionIds);
        return new PriceCalculationResponse(result.vehicleBasePrice(), result.optionsTotalPrice(), result.totalPrice());
    }
}
