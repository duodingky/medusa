import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260206000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "order_with_sf" ("id" text not null, "order_id" text not null, "display_id" integer not null, "email" text null, "currency_code" text not null, "region_id" text null, "customer_id" text null, "sales_channel_id" text null, "status" text null, "total" numeric not null, "subtotal" numeric not null, "tax_total" numeric not null, "discount_total" numeric not null, "shipping_total" numeric not null, "service_fee_total" numeric null, "shipping_address" jsonb null, "billing_address" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_with_sf_pkey" primary key ("id"));'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "order_with_sf" cascade;');
  }
}
