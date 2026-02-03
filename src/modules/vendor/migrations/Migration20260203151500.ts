import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203151500 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "vendor" add column if not exists "email" text null;');

    this.addSql(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'vendor_email_unique'
        ) THEN
          ALTER TABLE "vendor" ADD CONSTRAINT "vendor_email_unique" UNIQUE ("email");
        END IF;
      END
      $$;
    `);
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "vendor" drop constraint if exists "vendor_email_unique";');
    this.addSql('alter table if exists "vendor" drop column if exists "email";');
  }
}
