import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260206000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "sf_order" ("id" text not null, "order_id" text not null, "display_id" integer not null, "email" text null, "currency_code" text not null, "region_id" text null, "customer_id" text null, "sales_channel_id" text null, "status" text null, "total" numeric not null, "subtotal" numeric not null, "tax_total" numeric not null, "discount_total" numeric not null, "shipping_total" numeric not null, "service_fee_total" numeric null, "shipping_address" jsonb null, "billing_address" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), constraint "sf_order_pkey" primary key ("id"));'
    );
    
    this.addSql(
      'create index if not exists "sf_order_order_id_index" on "sf_order" ("order_id");'
    );
    
    this.addSql(
      'create index if not exists "sf_order_display_id_index" on "sf_order" ("display_id");'
    );
    
    this.addSql(
      'create index if not exists "sf_order_customer_id_index" on "sf_order" ("customer_id");'
    );
    
    this.addSql(
      'create index if not exists "sf_order_created_at_index" on "sf_order" ("created_at");'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "sf_order" cascade;');
  }
}
