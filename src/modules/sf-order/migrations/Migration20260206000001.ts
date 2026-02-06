import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260206000001 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "sf_line_item" ("id" text not null, "sf_order_id" text not null, "line_item_id" text not null, "title" text not null, "quantity" integer not null, "unit_price" numeric not null, "subtotal" numeric not null, "total" numeric not null, "tax_total" numeric null, "discount_total" numeric null, "variant_id" text null, "product_id" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), constraint "sf_line_item_pkey" primary key ("id"));'
    );
    
    this.addSql(
      'create index if not exists "sf_line_item_sf_order_id_index" on "sf_line_item" ("sf_order_id");'
    );
    
    this.addSql(
      'create index if not exists "sf_line_item_line_item_id_index" on "sf_line_item" ("line_item_id");'
    );
    
    this.addSql(
      'create index if not exists "sf_line_item_product_id_index" on "sf_line_item" ("product_id");'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "sf_line_item" cascade;');
  }
}
