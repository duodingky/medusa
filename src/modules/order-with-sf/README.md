# Service Fee Order Module

This module handles storing order and order item data with service fees applied.

## Tables

- `order_with_sf`: Stores order information with service fee total
- `order_item_with_sf`: Stores order line items with service fee information

## Usage

The module is automatically integrated and saves order data when the cart completion endpoint is called.
