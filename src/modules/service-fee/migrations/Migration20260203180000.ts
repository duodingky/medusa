import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203180000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "servcie_fee" add column if not exists "eligibility_config" jsonb null;'
    );
  }

  async down(): Promise<void> {
    this.addSql('alter table "servcie_fee" drop column if exists "eligibility_config";');
  }
}
