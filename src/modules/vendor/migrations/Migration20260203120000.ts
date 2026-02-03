import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "vendor" ("id" text not null, "name" text not null, "phone" text null, "description" text null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_pkey" primary key ("id"), constraint "vendor_name_unique" unique ("name"));'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "vendor" cascade;');
  }
}
