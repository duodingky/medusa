import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ServiceFeesModuleService from "../../../../modules/service_fees/service"

// GET: Retrieve a single fee by ID
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: ServiceFeesModuleService = req.scope.resolve("serviceFeesModuleService")
  
  // .retrieve... is the standard Medusa name for getting by ID
  const fee = await service.retrieveServiceFee(req.params.id)

  res.status(200).json({ service_fee: fee })
}

// POST: Update an existing fee
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: ServiceFeesModuleService = req.scope.resolve("serviceFeesModuleService")
  
  // Note: updateServiceFees usually expects an object containing the ID
  const fee = await service.updateServiceFees({
    id: req.params.id,
    ...(req.validatedBody as object)
  })

  res.status(200).json({ service_fee: fee })
}

// DELETE: Remove a fee
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: ServiceFeesModuleService = req.scope.resolve("serviceFeesModuleService")
  
  await service.deleteServiceFees(req.params.id)

  res.status(200).json({ 
    id: req.params.id, 
    object: "service_fee", 
    deleted: true 
  })
}