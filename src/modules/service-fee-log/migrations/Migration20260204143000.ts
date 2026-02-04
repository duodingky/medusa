import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260204143000 extends Migration {
  async up(): Promise<void> {
    this.addSql('drop table if exists "service_fee_logs" cascade;');
    this.addSql(
      'create table if not exists "service_fee_logs" ("id" bigserial not null, "service_fee_id" text not null, "user" text null, "display_name" text null, "fee_name" text null, "charging_level" text null, "rate" numeric null, "valid_from" timestamptz null, "valid_to" timestamptz null, "status" text null, "eligibility_config" jsonb null, "date_added" timestamptz not null default now(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_fee_logs_pkey" primary key ("id"));'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "service_fee_logs" cascade;');
  }
}
