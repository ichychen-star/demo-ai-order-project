CREATE TABLE vehicle_options (
    id         CHAR(36)       NOT NULL,
    name       VARCHAR(100)   NOT NULL,
    price      DECIMAL(15, 2) NOT NULL,
    active     BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE INDEX IX_vehicle_options_active ON vehicle_options (active);
