import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203190000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "vendor_vendor_product_product" rename to "vendor_product";'
    );
    this.addSql(
      `update "link_module_migrations"
       set table_name = 'vendor_product',
           link_descriptor = '{"fromModule":"vendor","toModule":"product","fromModel":"vendor","toModel":"product"}'
       where table_name = 'vendor_vendor_product_product';`
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "vendor_product" rename to "vendor_vendor_product_product";'
    );
    this.addSql(
      `update "link_module_migrations"
       set table_name = 'vendor_vendor_product_product',
           link_descriptor = '{"fromModule":"vendor","toModule":"product","fromModel":"vendor","toModel":"product"}'
       where table_name = 'vendor_product';`
    );
  }
}
