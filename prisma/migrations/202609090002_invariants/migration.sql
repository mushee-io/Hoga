ALTER TABLE "Service" ADD CONSTRAINT "service_pricing_bounds" CHECK ("price" > 0 AND "minimum" >= 0 AND "minimum" <= "price" AND "maxDiscount" BETWEEN 0 AND 100);
ALTER TABLE "Quote" ADD CONSTRAINT "quote_pricing_bounds" CHECK ("amount" > 0 AND "amount" >= "floor" AND "amount" <= "baseAmount" AND "maxDiscount" BETWEEN 0 AND 100 AND "amount" >= ceil("baseAmount" * (100 - "maxDiscount") / 100 * 1000000) / 1000000 AND ("negotiation" OR "amount" = "baseAmount"));
ALTER TABLE "Order" ADD CONSTRAINT "order_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "Payment" ADD CONSTRAINT "payment_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "Payment" ADD CONSTRAINT "payment_mode" CHECK ("mode" IN ('demo','live'));
ALTER TABLE "Review" ADD CONSTRAINT "rating_range" CHECK ("rating" BETWEEN 1 AND 5);
CREATE FUNCTION protect_accepted_quote() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."status" = 'ACCEPTED' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Accepted quotes are immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_accepted_quote BEFORE UPDATE ON "Quote" FOR EACH ROW EXECUTE FUNCTION protect_accepted_quote();
CREATE FUNCTION protect_order_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."amount" IS DISTINCT FROM OLD."amount" OR NEW."currency" IS DISTINCT FROM OLD."currency" OR NEW."quoteId" IS DISTINCT FROM OLD."quoteId" OR NEW."businessId" IS DISTINCT FROM OLD."businessId" OR NEW."customerId" IS DISTINCT FROM OLD."customerId" OR NEW."businessName" IS DISTINCT FROM OLD."businessName" THEN
    RAISE EXCEPTION 'Order financial snapshots are immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_order_snapshot BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION protect_order_snapshot();
