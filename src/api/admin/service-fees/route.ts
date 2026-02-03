import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ServiceFeesModuleService from "../../../modules/service_fees/service"

// POST: Create a new Fee
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // Resolve the service from the container
  const service: ServiceFeesModuleService = req.scope.resolve("serviceFeesModuleService")
  
  // Medusa expects an array for 'create' methods by default, 
  // but MedusaService handles a single object as well.
  const fee = await service.createServiceFees(req.validatedBody  as any)
  
  res.status(200).json({ service_fee: fee })
}


export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("serviceFeesModuleService")
  const listConfig = req.listConfig || {
    take: 20,
    skip: 0,
    select: ["*"]
  }

  const [fees, count] = await service.listAndCountServiceFees(
    req.filterableFields || {},
    listConfig
  )

  res.json({ 
    service_fees: fees, 
    count,
    limit: listConfig.take,
    offset: listConfig.skip 
  })
}