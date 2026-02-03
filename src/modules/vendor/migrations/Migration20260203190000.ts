import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203190000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF to_regclass('public.vendor_product') IS NOT NULL
          AND to_regclass('public.vendor_vendor_product_product') IS NULL THEN
          EXECUTE 'ALTER TABLE "public"."vendor_product" RENAME TO "vendor_vendor_product_product"';
        END IF;
      END
      $$;
    `);

    this.addSql(`
      DO $$
      BEGIN
        IF to_regclass('public.link_module_migrations') IS NOT NULL THEN
          UPDATE "public"."link_module_migrations"
          SET table_name = 'vendor_vendor_product_product',
              link_descriptor = '{"fromModule":"vendor","toModule":"product","fromModel":"vendor","toModel":"product"}'
          WHERE table_name = 'vendor_product';
        END IF;
      END
      $$;
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF to_regclass('public.vendor_vendor_product_product') IS NOT NULL
          AND to_regclass('public.vendor_product') IS NULL THEN
          EXECUTE 'ALTER TABLE "public"."vendor_vendor_product_product" RENAME TO "vendor_product"';
        END IF;
      END
      $$;
    `);

    this.addSql(`
      DO $$
      BEGIN
        IF to_regclass('public.link_module_migrations') IS NOT NULL THEN
          UPDATE "public"."link_module_migrations"
          SET table_name = 'vendor_product',
              link_descriptor = '{"fromModule":"vendor","toModule":"product","fromModel":"vendor","toModel":"product"}'
          WHERE table_name = 'vendor_vendor_product_product';
        END IF;
      END
      $$;
    `);
  }
}
