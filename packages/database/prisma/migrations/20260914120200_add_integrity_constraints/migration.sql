-- === hand-written: constraints, triggers, partial unique indexes, composite FKs, ===
-- === trigram indexes and application-role grants Prisma cannot express (data-model §9) ===
--
-- This file is the backstop for the hazard in §15: a later `prisma migrate dev` that
-- regenerates a table can silently drop these objects. The constraint-existence test
-- asserts every named object below is present after migrate deploy.

-- ---------------------------------------------------------------------------
-- 9.1 CHECK constraints
-- ---------------------------------------------------------------------------

ALTER TABLE "order_items" ADD CONSTRAINT order_items_money_nonneg CHECK (
  "unitPrice" >= 0 AND "quantity" > 0 AND "lineSubtotal" >= 0
  AND "discountAllocated" >= 0 AND "lineTotal" >= 0
);

ALTER TABLE "order_items" ADD CONSTRAINT order_items_line_math CHECK (
  "lineSubtotal" = "unitPrice" * "quantity"
  AND "lineTotal" = "lineSubtotal" - "discountAllocated"
  AND "discountAllocated" <= "lineSubtotal"
);

ALTER TABLE "orders" ADD CONSTRAINT orders_total_math CHECK (
  CASE "taxMode"
    WHEN 'INCLUSIVE' THEN "grandTotal" = "subtotal" - "discountTotal" + "deliveryTotal"
    WHEN 'EXCLUSIVE' THEN "grandTotal" = "subtotal" - "discountTotal" + "deliveryTotal" + "taxTotal"
  END
  AND "subtotal" >= 0 AND "discountTotal" >= 0 AND "deliveryTotal" >= 0
  AND "taxTotal" >= 0 AND "grandTotal" >= 0
  AND "refundedTotal" >= 0 AND "refundedTotal" <= "grandTotal"
);

ALTER TABLE "orders" ADD CONSTRAINT orders_inclusive_tax_bound CHECK (
  "taxMode" <> 'INCLUSIVE' OR "taxTotal" <= "grandTotal"
);

ALTER TABLE "orders" ADD CONSTRAINT orders_delivery_tax_bound CHECK (
  "deliveryTaxAmount" >= 0 AND "deliveryTaxAmount" <= "taxTotal"
  AND "deliveryTaxRateBp" >= 0 AND "deliveryTaxRateBp" <= 100000
);

ALTER TABLE "order_items" ADD CONSTRAINT order_items_tax_bounds CHECK (
  "taxAmount" >= 0 AND "taxRateBp" >= 0 AND "taxRateBp" <= 100000
);

ALTER TABLE "order_tax_lines" ADD CONSTRAINT order_tax_lines_bounds CHECK (
  "taxAmount" >= 0 AND "taxableAmount" >= 0 AND "rateBp" >= 0 AND "rateBp" <= 100000
);

ALTER TABLE "tax_rates" ADD CONSTRAINT tax_rates_bounds CHECK (
  "rateBp" >= 0 AND "rateBp" <= 100000
  AND ("effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom")
);

ALTER TABLE "refunds" ADD CONSTRAINT refunds_tax_bound CHECK (
  "taxAmount" >= 0 AND "taxAmount" <= "amount"
);

ALTER TABLE "inventory_items" ADD CONSTRAINT inventory_nonneg CHECK (
  "onHandQty" >= 0 AND "reservedQty" >= 0 AND "availableQty" >= 0
);

ALTER TABLE "inventory_items" ADD CONSTRAINT inventory_available_math CHECK (
  "availableQty" = "onHandQty" - "reservedQty"
);

ALTER TABLE "inventory_items" ADD CONSTRAINT inventory_flags_math CHECK (
  "isOutOfStock" = ("availableQty" <= 0)
  AND "isLowStock" = ("trackInventory" AND "availableQty" <= "lowStockThreshold")
);

ALTER TABLE "stock_movements" ADD CONSTRAINT stock_movements_reason_required CHECK (
  "type" <> 'MANUAL_ADJUSTMENT' OR ("reason" IS NOT NULL AND length(btrim("reason")) > 0)
);

ALTER TABLE "stock_movements" ADD CONSTRAINT stock_movements_not_noop CHECK (
  "onHandDelta" <> 0 OR "reservedDelta" <> 0
);

ALTER TABLE "discounts" ADD CONSTRAINT discounts_value_range CHECK (
  ("type" = 'PERCENTAGE'   AND "value" > 0 AND "value" <= 100) OR
  ("type" = 'FIXED_AMOUNT' AND "value" > 0 AND "value" = trunc("value"))
);

ALTER TABLE "discounts" ADD CONSTRAINT discounts_window CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");

ALTER TABLE "reviews" ADD CONSTRAINT reviews_rating_range CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "testimonials" ADD CONSTRAINT testimonials_rating_range CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5);

ALTER TABLE "refresh_tokens" ADD CONSTRAINT refresh_tokens_subject_xor CHECK (
  (("adminUserId" IS NOT NULL)::int + ("customerId" IS NOT NULL)::int) = 1
  AND (("audience" = 'ADMIN') = ("adminUserId" IS NOT NULL))
);

ALTER TABLE "auth_tokens" ADD CONSTRAINT auth_tokens_subject_xor CHECK (
  (("adminUserId" IS NOT NULL)::int + ("customerId" IS NOT NULL)::int) = 1
  AND (("audience" = 'ADMIN') = ("adminUserId" IS NOT NULL))
);

ALTER TABLE "notifications" ADD CONSTRAINT notifications_recipient_xor CHECK (
  (("adminUserId" IS NOT NULL)::int + ("customerId" IS NOT NULL)::int) = 1
  AND (("audience" = 'ADMIN') = ("adminUserId" IS NOT NULL))
);

ALTER TABLE "collections" ADD CONSTRAINT collections_rule_mode CHECK (
  "type" = 'MANUAL' OR "ruleMatchMode" IS NOT NULL
);

ALTER TABLE "media_assets" ADD CONSTRAINT media_assets_alt_required CHECK (
  "mimeType" NOT LIKE 'image/%' OR ("altText" IS NOT NULL AND length(btrim("altText")) > 0)
);

ALTER TABLE "delivery_methods" ADD CONSTRAINT delivery_eta_order CHECK (
  "estimatedMinHours" >= 0 AND "estimatedMaxHours" >= "estimatedMinHours"
);

ALTER TABLE "orders" ADD CONSTRAINT orders_currency_xof CHECK ("currency" = 'XOF');

ALTER TABLE "payments" ADD CONSTRAINT payments_currency_xof CHECK ("currency" = 'XOF');

ALTER TABLE "carts" ADD CONSTRAINT carts_currency_xof CHECK ("currency" = 'XOF');

-- ---------------------------------------------------------------------------
-- 9.2 Partial unique indexes
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX product_variants_one_default
  ON product_variants ("productId") WHERE "isDefault" AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX carts_one_active_per_customer
  ON carts ("customerId") WHERE "status" = 'ACTIVE' AND "customerId" IS NOT NULL;

CREATE UNIQUE INDEX stock_reservations_one_held_per_item
  ON stock_reservations ("orderItemId") WHERE "status" = 'HELD';

CREATE UNIQUE INDEX addresses_one_default_shipping
  ON addresses ("customerId") WHERE "isDefaultShipping" AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX addresses_one_default_billing
  ON addresses ("customerId") WHERE "isDefaultBilling" AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX product_images_one_primary
  ON product_images ("productId") WHERE "isPrimary";

CREATE UNIQUE INDEX tax_categories_one_default
  ON tax_categories (("isDefault")) WHERE "isDefault";

CREATE UNIQUE INDEX tax_rates_one_current
  ON tax_rates ("taxZoneId", "taxCategoryId") WHERE "effectiveTo" IS NULL AND "isActive";

-- ---------------------------------------------------------------------------
-- §8 trigram indexes for admin global search
-- ---------------------------------------------------------------------------

CREATE INDEX products_name_trgm      ON products      USING gin ("name" gin_trgm_ops);
CREATE INDEX customers_name_trgm     ON customers     USING gin (("firstName" || ' ' || "lastName") gin_trgm_ops);
CREATE INDEX orders_reference_trgm   ON orders        USING gin ("reference" gin_trgm_ops);
CREATE INDEX discounts_code_trgm     ON discounts     USING gin ("code" gin_trgm_ops);
CREATE INDEX static_pages_title_trgm ON static_pages  USING gin ("title" gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- §6.9 composite foreign keys for review eligibility
-- ---------------------------------------------------------------------------

ALTER TABLE reviews
  ADD CONSTRAINT reviews_orderitem_product_fk
  FOREIGN KEY ("orderItemId", "productId")
  REFERENCES order_items ("id", "productId") ON DELETE CASCADE;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_order_customer_fk
  FOREIGN KEY ("orderId", "customerId")
  REFERENCES orders ("id", "customerId") ON DELETE CASCADE;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_orderitem_order_fk
  FOREIGN KEY ("orderItemId", "orderId")
  REFERENCES order_items ("id", "orderId") ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 9.4 Triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION kd_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; % is not permitted', TG_TABLE_NAME, TG_OP;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movements_append_only
  BEFORE UPDATE OR DELETE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION kd_append_only();

CREATE TRIGGER trg_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION kd_append_only();

CREATE TRIGGER trg_order_status_history_append_only
  BEFORE UPDATE OR DELETE ON order_status_history
  FOR EACH ROW EXECUTE FUNCTION kd_append_only();

CREATE OR REPLACE FUNCTION kd_inventory_requires_ledger() RETURNS trigger AS $$
BEGIN
  IF current_setting('kairos.inventory_ledger', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION
      'inventory_items may only be modified through InventoryService (ledger context not set)';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_requires_ledger
  BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION kd_inventory_requires_ledger();

CREATE OR REPLACE FUNCTION kd_order_items_immutable() RETURNS trigger AS $$
BEGIN
  IF NEW."unitPrice" IS DISTINCT FROM OLD."unitPrice"
     OR NEW."quantity" IS DISTINCT FROM OLD."quantity"
     OR NEW."lineSubtotal" IS DISTINCT FROM OLD."lineSubtotal"
     OR NEW."lineTotal" IS DISTINCT FROM OLD."lineTotal"
     OR NEW."productSnapshot" IS DISTINCT FROM OLD."productSnapshot" THEN
    RAISE EXCEPTION 'order_items snapshot columns are immutable (order line %)', OLD.id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_items_immutable
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION kd_order_items_immutable();

CREATE OR REPLACE FUNCTION kd_assert_review_eligibility() RETURNS trigger AS $$
DECLARE o RECORD;
BEGIN
  SELECT "customerId", "deliveredAt" INTO o
    FROM orders WHERE id = NEW."orderId" FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'review: order % not found', NEW."orderId";
  END IF;
  IF o."customerId" IS DISTINCT FROM NEW."customerId" THEN
    RAISE EXCEPTION 'review: order % not owned by customer %', NEW."orderId", NEW."customerId";
  END IF;
  IF o."deliveredAt" IS NULL THEN
    RAISE EXCEPTION 'review: order % has never reached DELIVERED', NEW."orderId";
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_eligibility
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION kd_assert_review_eligibility();

CREATE OR REPLACE FUNCTION kd_protect_system_segments() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."isSystem" THEN
      RAISE EXCEPTION 'customer_segments: system segment % cannot be deleted', OLD."key";
    END IF;
    RETURN OLD;
  END IF;

  IF OLD."isSystem" AND NEW."key" IS DISTINCT FROM OLD."key" THEN
    RAISE EXCEPTION 'customer_segments: key of system segment % is immutable', OLD."key";
  END IF;
  IF OLD."isSystem" AND NOT NEW."isSystem" THEN
    RAISE EXCEPTION 'customer_segments: system segment % cannot be demoted', OLD."key";
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_segments_protect_system
  BEFORE UPDATE OR DELETE ON customer_segments
  FOR EACH ROW EXECUTE FUNCTION kd_protect_system_segments();

CREATE OR REPLACE FUNCTION kd_assert_order_claim_verified() RETURNS trigger AS $$
DECLARE v TIMESTAMPTZ;
BEGIN
  IF OLD."customerId" IS NULL AND NEW."customerId" IS NOT NULL THEN
    SELECT "emailVerifiedAt" INTO v FROM customers WHERE id = NEW."customerId";
    IF v IS NULL THEN
      RAISE EXCEPTION
        'order %: cannot be claimed by customer % before email verification',
        NEW.id, NEW."customerId";
    END IF;
  ELSIF OLD."customerId" IS NOT NULL AND NEW."customerId" IS DISTINCT FROM OLD."customerId" THEN
    RAISE EXCEPTION 'order %: ownership cannot be transferred once claimed', NEW.id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_claim_requires_verification
  BEFORE UPDATE OF "customerId" ON orders
  FOR EACH ROW EXECUTE FUNCTION kd_assert_order_claim_verified();

-- ---------------------------------------------------------------------------
-- 9.5 Application role. Password is a local/CI default only — production MUST
-- ALTER ROLE kairos_app and never reuse this value. The role is LOGIN so gate
-- tests can connect as it; it has no DDL and no UPDATE/DELETE on append-only
-- tables. Vault: INSERT/SELECT/DELETE as specified in §6.6.1 (payments:configure
-- is an application check, not a database grant).
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'kairos_app') THEN
    CREATE ROLE kairos_app LOGIN PASSWORD 'kairos_app' NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT;
  END IF;
END $$;

DO $$
DECLARE db text := current_database();
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO kairos_app', db);
END $$;

GRANT USAGE ON SCHEMA public TO kairos_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kairos_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kairos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kairos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO kairos_app;

REVOKE CREATE ON SCHEMA public FROM kairos_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

REVOKE UPDATE, DELETE ON stock_movements FROM kairos_app;
REVOKE UPDATE, DELETE ON audit_logs FROM kairos_app;
REVOKE UPDATE, DELETE ON order_status_history FROM kairos_app;

REVOKE ALL ON payment_webhook_payload_vault FROM PUBLIC;
GRANT INSERT, SELECT, DELETE ON payment_webhook_payload_vault TO kairos_app;
REVOKE UPDATE ON payment_webhook_payload_vault FROM kairos_app;
