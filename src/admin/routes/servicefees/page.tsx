import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Buildings } from "@medusajs/icons" // Changed from Utensils
import { Container, Heading } from "@medusajs/ui"

const RestaurantPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Service Fee Management</Heading>
      </div>
      <div className="px-6 py-4">
        <p className="text-ui-fg-subtle">
          
        </p>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Service Fee Management",
  icon: Buildings, // Changed from Utensils
})

export default RestaurantPage