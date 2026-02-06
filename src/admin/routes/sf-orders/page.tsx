import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ShoppingCart } from "@medusajs/icons";
import { Container, Heading, Table, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type SfOrder = {
  id: string;
  order_id: string;
  display_id: number;
  email: string | null;
  currency_code: string;
  status: string | null;
  total: number;
  subtotal: number;
  service_fee_total: number | null;
  created_at: string;
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

const SfOrdersPage = () => {
  const [orders, setOrders] = useState<SfOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/admin/sf-orders", {
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to load orders");
        throw new Error(message);
      }

      const data = await response.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRowClick = (orderId: string) => {
    navigate(`/sf-orders/${orderId}`);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Service Fee Orders</Heading>
      </div>
      
      {error && (
        <div className="px-6 py-4">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="px-6 py-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-ui-fg-subtle">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-ui-fg-subtle">No orders found</p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order #</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
                <Table.HeaderCell>Service Fee</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.map((order) => (
                <Table.Row
                  key={order.id}
                  onClick={() => handleRowClick(order.id)}
                  className="cursor-pointer hover:bg-ui-bg-subtle"
                >
                  <Table.Cell>#{order.display_id}</Table.Cell>
                  <Table.Cell>{order.email || 'N/A'}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small">
                      {order.status || 'pending'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {formatCurrency(order.total, order.currency_code)}
                  </Table.Cell>
                  <Table.Cell>
                    {order.service_fee_total 
                      ? formatCurrency(order.service_fee_total, order.currency_code)
                      : 'N/A'}
                  </Table.Cell>
                  <Table.Cell>{formatDate(order.created_at)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "SF Orders",
  icon: ShoppingCart,
});

export default SfOrdersPage;
