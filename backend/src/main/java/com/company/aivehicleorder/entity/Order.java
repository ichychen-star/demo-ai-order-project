package com.company.aivehicleorder.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "order_no", nullable = false, length = 50, unique = true)
    private String orderNo;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 50)
    private String customerPhone;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    @ToString.Exclude
    private Vehicle vehicle;

    @Column(name = "exterior_color", nullable = false, length = 50)
    private String exteriorColor;

    @Column(name = "interior_color", nullable = false, length = 50)
    private String interiorColor;

    @Column(name = "vehicle_base_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal vehicleBasePrice;

    @Column(name = "options_total_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal optionsTotalPrice;

    @Column(name = "total_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "expected_delivery_month", nullable = false, length = 7)
    private String expectedDeliveryMonth;

    @Column(name = "status", nullable = false, length = 30)
    private String status = OrderStatus.DRAFT.name();

    @Column(name = "source_type", length = 20)
    private String sourceType;

    @Column(name = "source_text", columnDefinition = "TEXT")
    private String sourceText;

    @Column(name = "uploaded_file_name", length = 255)
    private String uploadedFileName;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "ai_email", columnDefinition = "TEXT")
    private String aiEmail;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<OrderOption> options = new ArrayList<>();

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
