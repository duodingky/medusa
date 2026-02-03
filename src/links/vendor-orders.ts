import VendorModule from "../modules/vendor";
import OrderModule from "@medusajs/order";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  VendorModule.linkable.vendor,
  {
    linkable: OrderModule.linkable.order.id,
    isList: true,
  }
);
