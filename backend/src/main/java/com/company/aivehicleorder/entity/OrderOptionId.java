package com.company.aivehicleorder.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderOptionId implements Serializable {

    @Column(name = "order_id", columnDefinition = "CHAR(36)")
    private UUID orderId;

    @Column(name = "option_id", columnDefinition = "CHAR(36)")
    private UUID optionId;
}
