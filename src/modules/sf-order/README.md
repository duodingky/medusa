# SF Order Module

This module saves order details in custom tables (prefixed with `sf_`) when a cart is completed.

## Tables Created

- **sf_order**: Stores order details including totals, customer info, and service fees
- **sf_line_item**: Stores line items for each order

## How It Works

1. When a cart is completed at `/store/carts/{id}/complete`, an `order.placed` event is emitted
2. The subscriber in `/src/subscribers/order-placed.ts` listens for this event
3. The subscriber saves the order data to `sf_order` and `sf_line_item` tables
4. Service fee information can be stored in the `service_fee_total` field

## Admin Dashboard

Access the SF Orders dashboard in the admin panel:
- **List View**: `/app/sf-orders` - Shows all orders with service fees
- **Detail View**: `/app/sf-orders/{id}` - Shows complete order details including:
  - Order information
  - Line items
  - Service fees
  - Shipping and billing addresses
  - Order totals breakdown

## API Endpoints

- `GET /admin/sf-orders` - List all orders
- `GET /admin/sf-orders/{id}` - Get order details with line items and service fees

## Setup

The module is automatically registered in `medusa-config.ts`. After adding the module, run:

```bash
npx medusa db:migrate
```

This will create the necessary tables in your database.
