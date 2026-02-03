import VendorModule from "../modules/vendor";
import ProductModule from "@medusajs/product";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  VendorModule.linkable.vendor,
  {
    linkable: ProductModule.linkable.product.id,
    isList: true,
  }
);
