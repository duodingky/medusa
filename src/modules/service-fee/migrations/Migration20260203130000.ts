import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203130000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "servcie_fee" ("id" text not null, "display_name" text not null, "fee_name" text not null, "charging_level" text not null, "rate" numeric not null, "valid_from" timestamptz null, "valid_to" timestamptz null, "status" text not null, "date_created" timestamptz not null default now(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "servcie_fee_pkey" primary key ("id"));'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "servcie_fee" cascade;');
  }
}
