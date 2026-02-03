import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203143000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "vendor" drop column if exists "handle";');
    this.addSql('alter table if exists "vendor" drop column if exists "email";');

    this.addSql(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'vendor_name_unique'
        ) THEN
          ALTER TABLE "vendor" ADD CONSTRAINT "vendor_name_unique" UNIQUE ("name");
        END IF;
      END
      $$;
    `);
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "vendor" drop constraint if exists "vendor_name_unique";');

    this.addSql('alter table if exists "vendor" add column if not exists "handle" text;');
    this.addSql('alter table if exists "vendor" add column if not exists "email" text;');

    this.addSql('update "vendor" set "handle" = \'\' where "handle" is null;');
    this.addSql('alter table if exists "vendor" alter column "handle" set not null;');
  }
}
