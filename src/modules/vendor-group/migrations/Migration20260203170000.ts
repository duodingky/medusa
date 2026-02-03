import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203170000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "vendor_group" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_group_pkey" primary key ("id"), constraint "vendor_group_name_unique" unique ("name"));'
    );

    this.addSql(
      'create table if not exists "vendor_group_vendor" ("id" text not null, "vendor_group_id" text not null, "vendor_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_group_vendor_pkey" primary key ("id"));'
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_vendor_group_vendor_group_id" ON "vendor_group_vendor" (vendor_group_id) WHERE deleted_at IS NULL;'
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_vendor_group_vendor_vendor_id" ON "vendor_group_vendor" (vendor_id) WHERE deleted_at IS NULL;'
    );
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_group_vendor_unique" ON "vendor_group_vendor" ("vendor_group_id", "vendor_id") WHERE deleted_at IS NULL;'
    );

    this.addSql(
      'alter table if exists "vendor_group_vendor" add constraint "vendor_group_vendor_group_id_foreign" foreign key ("vendor_group_id") references "vendor_group" ("id") on update cascade on delete cascade;'
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "vendor_group_vendor" drop constraint if exists "vendor_group_vendor_group_id_foreign";'
    );

    this.addSql('drop table if exists "vendor_group_vendor" cascade;');
    this.addSql('drop table if exists "vendor_group" cascade;');
  }
}
