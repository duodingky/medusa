import { model } from "@medusajs/utils"

const ServiceFees = model.define("service_fee", {
  id: model.id({ prefix: "sf" }).primaryKey(),
  name: model.text(),
  display_name: model.text(),
  rate: model.float(), 
  type: model.enum(["global", "item", "shop"]),
  status: model.enum(["active", "pending", "inactive"]).default("pending"),
  effective_date: model.dateTime(),
  end_date: model.dateTime().nullable(),
  eligibility_config: model.json().default({}),
})

export default ServiceFees