package com.company.aivehicleorder.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "order_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderOption {

    @EmbeddedId
    private OrderOptionId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("orderId")
    @JoinColumn(name = "order_id")
    @ToString.Exclude
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("optionId")
    @JoinColumn(name = "option_id")
    private VehicleOption vehicleOption;

    @Column(name = "option_name", nullable = false, length = 100)
    private String optionName;

    @Column(name = "option_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal optionPrice;
}
