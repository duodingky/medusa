import MarketplaceModule from "../modules/marketplace";
import OrderModule from "@medusajs/order";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  MarketplaceModule.linkable.vendor,
  {
    linkable: OrderModule.linkable.order.id,
    isList: true,
  }
);
