import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260204120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "service_fee_logs" ("id" text not null, "service_fee_id" text not null, "action" text not null, "note" text not null, "actor_id" text null, "actor_type" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_fee_logs_pkey" primary key ("id"));'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "service_fee_logs" cascade;');
  }
}
