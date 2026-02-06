import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260206072553 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "new_order_item" ("id" text not null, "order_id" text null, "product_id" text null, "variant_id" text null, "quantity" integer null, "unit_price" numeric null, "final_price" numeric null, "service_fee_amount" numeric null, "service_fee_rate" decimal null, "subtotal" numeric null, "total" numeric null, "vendor_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "new_order_item_pkey" primary key ("id"));'
    );
    this.addSql(
      'create index if not exists "idx_new_order_item_order_id" on "new_order_item" ("order_id");'
    );
    this.addSql(
      'create index if not exists "idx_new_order_item_product_id" on "new_order_item" ("product_id");'
    );
    this.addSql(
      'create index if not exists "idx_new_order_item_vendor_id" on "new_order_item" ("vendor_id");'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "new_order_item" cascade;');
  }
}
