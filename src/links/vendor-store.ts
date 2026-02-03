import VendorModule from "../modules/vendor";
import StoreModule from "@medusajs/store";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  VendorModule.linkable.vendor,
  StoreModule.linkable.store
);
