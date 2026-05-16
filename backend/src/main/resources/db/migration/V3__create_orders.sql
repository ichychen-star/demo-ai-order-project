CREATE TABLE orders (
    id                      CHAR(36)       NOT NULL,
    order_no                VARCHAR(50)    NOT NULL,
    customer_name           VARCHAR(100)   NOT NULL,
    customer_phone          VARCHAR(50)    NOT NULL,
    customer_email          VARCHAR(255)   NULL,
    vehicle_id              CHAR(36)       NOT NULL,
    exterior_color          VARCHAR(50)    NOT NULL,
    interior_color          VARCHAR(50)    NOT NULL,
    vehicle_base_price      DECIMAL(15, 2) NOT NULL,
    options_total_price     DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_price             DECIMAL(15, 2) NOT NULL,
    expected_delivery_month VARCHAR(7)     NOT NULL,
    status                  VARCHAR(30)    NOT NULL DEFAULT 'DRAFT',
    source_type             VARCHAR(20)    NULL,
    source_text             TEXT           NULL,
    uploaded_file_name      VARCHAR(255)   NULL,
    ai_summary              TEXT           NULL,
    ai_email                TEXT           NULL,
    deleted                 BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT UQ_orders_order_no UNIQUE (order_no),
    CONSTRAINT FK_orders_vehicles FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE INDEX IX_orders_deleted_status ON orders (deleted, status);
CREATE INDEX IX_orders_created_at ON orders (created_at DESC);
CREATE INDEX IX_orders_customer_name ON orders (customer_name);
