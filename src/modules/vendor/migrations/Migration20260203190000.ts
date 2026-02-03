import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203190000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "vendor_vendor_product_product" rename to "vendor_product";'
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "vendor_product" rename to "vendor_vendor_product_product";'
    );
  }
}
