-- Function to call BEFORE INSERT on each sample table:
CREATE OR REPLACE FUNCTION "wellables_insert"()
  RETURNS TRIGGER AS $$
  BEGIN
      INSERT INTO "wellables" (id, table_name) VALUES (NEW.id, TG_TABLE_NAME::regclass::text);
      RETURN NEW;
  END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Function to call BEFORE DELETE on each sample table:
CREATE OR REPLACE FUNCTION "wellables_delete"()
  RETURNS TRIGGER AS $$
  BEGIN
      DELETE FROM "wellables" WHERE id = OLD.id AND table_name = TG_TABLE_NAME::regclass::text;
      RETURN OLD;
  END;
$$ LANGUAGE plpgsql;
