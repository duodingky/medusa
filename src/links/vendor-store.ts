import MarketplaceModule from "../modules/marketplace";
import StoreModule from "@medusajs/store";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  MarketplaceModule.linkable.vendor,
  StoreModule.linkable.store
);
