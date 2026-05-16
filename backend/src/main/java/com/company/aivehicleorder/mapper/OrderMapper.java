package com.company.aivehicleorder.mapper;

import com.company.aivehicleorder.dto.request.CreateOrderRequest;
import com.company.aivehicleorder.dto.response.OrderOptionResponse;
import com.company.aivehicleorder.dto.response.OrderResponse;
import com.company.aivehicleorder.entity.Order;
import com.company.aivehicleorder.entity.OrderOption;
import com.company.aivehicleorder.entity.OrderOptionId;
import com.company.aivehicleorder.entity.Vehicle;
import com.company.aivehicleorder.entity.VehicleOption;

import java.util.List;

public class OrderMapper {

    private OrderMapper() {}

    public static OrderResponse toResponse(Order order) {
        Vehicle v = order.getVehicle();
        return OrderResponse.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .customerEmail(order.getCustomerEmail())
                .vehicleId(v != null ? v.getId() : null)
                .vehicleName(v != null ? v.getBrand() + " " + v.getModel() : null)
                .exteriorColor(order.getExteriorColor())
                .interiorColor(order.getInteriorColor())
                .vehicleBasePrice(order.getVehicleBasePrice())
                .optionsTotalPrice(order.getOptionsTotalPrice())
                .totalPrice(order.getTotalPrice())
                .expectedDeliveryMonth(order.getExpectedDeliveryMonth())
                .status(order.getStatus())
                .sourceType(order.getSourceType())
                .sourceText(order.getSourceText())
                .uploadedFileName(order.getUploadedFileName())
                .aiSummary(order.getAiSummary())
                .aiEmail(order.getAiEmail())
                .deleted(order.isDeleted())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .options(order.getOptions().stream()
                        .map(OrderMapper::toOrderOptionResponse)
                        .toList())
                .build();
    }

    /**
     * Partial mapping — orderNo, vehicleBasePrice, optionsTotalPrice, totalPrice
     * are intentionally left unset and must be populated by the service layer.
     */
    public static Order toEntity(CreateOrderRequest req, Vehicle vehicle, List<VehicleOption> options) {
        Order order = new Order();
        order.setCustomerName(req.getCustomerName());
        order.setCustomerPhone(req.getCustomerPhone());
        order.setCustomerEmail(req.getCustomerEmail());
        order.setVehicle(vehicle);
        order.setExteriorColor(req.getExteriorColor());
        order.setInteriorColor(req.getInteriorColor());
        order.setExpectedDeliveryMonth(req.getExpectedDeliveryMonth());
        order.setStatus(req.getStatus());

        if (options != null) {
            options.forEach(opt -> {
                OrderOptionId optId = new OrderOptionId(null, opt.getId());
                order.getOptions().add(
                        new OrderOption(optId, order, opt, opt.getName(), opt.getPrice()));
            });
        }

        return order;
    }

    public static OrderOptionResponse toOrderOptionResponse(OrderOption oo) {
        return OrderOptionResponse.builder()
                .optionId(oo.getId().getOptionId())
                .optionName(oo.getOptionName())
                .optionPrice(oo.getOptionPrice())
                .build();
    }
}
