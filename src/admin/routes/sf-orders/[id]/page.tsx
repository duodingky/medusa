import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ShoppingCart } from "@medusajs/icons";
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type SfLineItem = {
  id: string;
  line_item_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  variant_id: string | null;
  product_id: string | null;
};

type ServiceFee = {
  id: string;
  service_fee_id: string;
  fee_name: string | null;
  rate: number | null;
  charging_level: string | null;
  status: string | null;
};

type SfOrder = {
  id: string;
  order_id: string;
  display_id: number;
  email: string | null;
  currency_code: string;
  status: string | null;
  total: number;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  shipping_total: number;
  service_fee_total: number | null;
  shipping_address: any;
  billing_address: any;
  created_at: string;
  line_items?: SfLineItem[];
  service_fees?: ServiceFee[];
};

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (data && typeof data.message === "string") {
      return data.message;
    }
  } catch (err) {
    // Ignore JSON parsing errors and fall back to default.
  }

  return fallback;
};

const formatCurrency = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const SfOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SfOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/admin/sf-orders/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to load order");
        throw new Error(message);
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  if (isLoading) {
    return (
      <Container className="p-6">
        <p className="text-ui-fg-subtle">Loading order...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="p-6">
        <p className="text-ui-fg-subtle">Order not found</p>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Button 
            variant="secondary" 
            size="small"
            onClick={() => navigate('/sf-orders')}
            className="mb-2"
          >
            ← Back to Orders
          </Button>
          <Heading level="h1">Order #{order.display_id}</Heading>
          <p className="text-ui-fg-subtle text-sm mt-1">{formatDate(order.created_at)}</p>
        </div>
        <Badge size="large">{order.status || 'pending'}</Badge>
      </div>

      {/* Order Summary */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Order Summary</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-ui-fg-subtle text-sm">Email</p>
            <p className="font-medium">{order.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-ui-fg-subtle text-sm">Order ID</p>
            <p className="font-medium font-mono text-xs">{order.order_id}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Line Items</Heading>
        {order.line_items && order.line_items.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Product</Table.HeaderCell>
                <Table.HeaderCell>Quantity</Table.HeaderCell>
                <Table.HeaderCell>Unit Price</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {order.line_items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>{item.title}</Table.Cell>
                  <Table.Cell>{item.quantity}</Table.Cell>
                  <Table.Cell>
                    {formatCurrency(item.unit_price, order.currency_code)}
                  </Table.Cell>
                  <Table.Cell>
                    {formatCurrency(item.total, order.currency_code)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <p className="text-ui-fg-subtle">No line items</p>
        )}
      </div>

      {/* Service Fees */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Service Fees</Heading>
        {order.service_fees && order.service_fees.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Fee Name</Table.HeaderCell>
                <Table.HeaderCell>Rate</Table.HeaderCell>
                <Table.HeaderCell>Level</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {order.service_fees.map((fee) => (
                <Table.Row key={fee.id}>
                  <Table.Cell>{fee.fee_name || 'N/A'}</Table.Cell>
                  <Table.Cell>{fee.rate ? `${fee.rate}%` : 'N/A'}</Table.Cell>
                  <Table.Cell>{fee.charging_level || 'N/A'}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small">{fee.status || 'N/A'}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <p className="text-ui-fg-subtle">No service fees applied</p>
        )}
      </div>

      {/* Order Totals */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Totals</Heading>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-ui-fg-subtle">Subtotal</span>
            <span>{formatCurrency(order.subtotal, order.currency_code)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ui-fg-subtle">Shipping</span>
            <span>{formatCurrency(order.shipping_total, order.currency_code)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ui-fg-subtle">Tax</span>
            <span>{formatCurrency(order.tax_total, order.currency_code)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between">
              <span className="text-ui-fg-subtle">Discount</span>
              <span className="text-red-600">
                -{formatCurrency(order.discount_total, order.currency_code)}
              </span>
            </div>
          )}
          {order.service_fee_total !== null && order.service_fee_total > 0 && (
            <div className="flex justify-between">
              <span className="text-ui-fg-subtle">Service Fee</span>
              <span>{formatCurrency(order.service_fee_total, order.currency_code)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-ui-border-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">
              {formatCurrency(order.total, order.currency_code)}
            </span>
          </div>
        </div>
      </div>

      {/* Addresses */}
      {(order.shipping_address || order.billing_address) && (
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Addresses</Heading>
          <div className="grid grid-cols-2 gap-4">
            {order.shipping_address && (
              <div>
                <p className="text-ui-fg-subtle text-sm mb-2">Shipping Address</p>
                <div className="text-sm">
                  <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                  <p>{order.shipping_address.address_1}</p>
                  {order.shipping_address.address_2 && <p>{order.shipping_address.address_2}</p>}
                  <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country_code}</p>
                  {order.shipping_address.phone && <p>Phone: {order.shipping_address.phone}</p>}
                </div>
              </div>
            )}
            {order.billing_address && (
              <div>
                <p className="text-ui-fg-subtle text-sm mb-2">Billing Address</p>
                <div className="text-sm">
                  <p>{order.billing_address.first_name} {order.billing_address.last_name}</p>
                  <p>{order.billing_address.address_1}</p>
                  {order.billing_address.address_2 && <p>{order.billing_address.address_2}</p>}
                  <p>{order.billing_address.city}, {order.billing_address.province} {order.billing_address.postal_code}</p>
                  <p>{order.billing_address.country_code}</p>
                  {order.billing_address.phone && <p>Phone: {order.billing_address.phone}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "SF Order Details",
});

export default SfOrderDetailPage;
