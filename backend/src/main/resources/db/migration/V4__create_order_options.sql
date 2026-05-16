CREATE TABLE order_options (
    order_id     CHAR(36)       NOT NULL,
    option_id    CHAR(36)       NOT NULL,
    option_name  VARCHAR(100)   NOT NULL,
    option_price DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (order_id, option_id),
    CONSTRAINT FK_order_options_orders         FOREIGN KEY (order_id)  REFERENCES orders (id)          ON DELETE CASCADE,
    CONSTRAINT FK_order_options_vehicle_options FOREIGN KEY (option_id) REFERENCES vehicle_options (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
