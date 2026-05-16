CREATE TABLE vehicles (
    id          CHAR(36)       NOT NULL,
    brand       VARCHAR(100)   NOT NULL,
    model       VARCHAR(100)   NOT NULL,
    base_price  DECIMAL(15, 2) NOT NULL,
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE INDEX IX_vehicles_active ON vehicles (active);
