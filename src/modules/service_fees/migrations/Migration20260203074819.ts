import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203074819 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "service_fee" ("id" text not null, "name" text not null, "display_name" text not null, "rate" real not null, "type" text check ("type" in ('global', 'item', 'shop')) not null, "status" text check ("status" in ('active', 'pending', 'inactive')) not null default 'pending', "effective_date" timestamptz not null, "end_date" timestamptz null, "eligibility_config" jsonb not null default '{}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_fee_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_deleted_at" ON "service_fee" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "service_fee" cascade;`);
  }

}
