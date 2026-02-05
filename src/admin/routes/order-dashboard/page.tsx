import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useMemo, useState } from "react";

type OrderItem = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  variant_sku?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  subtotal?: number | null;
  total?: number | null;
};

type OrderLike = {
  id: string;
  status?: string | null;
  email?: string | null;
  currency_code?: string | null;
  display_id?: number | null;
  subtotal?: number | null;
  tax_total?: number | null;
  shipping_total?: number | null;
  discount_total?: number | null;
  service_fee?: number | null;
  total?: number | null;
  original_total?: number | null;
  created_at?: string | null;
  items?: OrderItem[];
  order_items?: OrderItem[];
  summary?: {
    current_order_total?: number | null;
    original_order_total?: number | null;
  } | null;
  cart?: {
    id?: string | null;
    email?: string | null;
    currency_code?: string | null;
    subtotal?: number | null;
    tax_total?: number | null;
    shipping_total?: number | null;
    service_fee?: number | null;
    total?: number | null;
  } | null;
};

const defaultOrderId = "order_01KGR1VFMT4R7KF0HRPM89C296";

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString();
};

const formatAmount = (amount?: number | null, currency?: string | null) => {
  if (amount === null || amount === undefined) {
    return "-";
  }

  const normalizedCurrency = currency ? currency.toUpperCase() : "USD";
  const value = Number(amount);

  if (Number.isNaN(value)) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
    }).format(value);
  } catch (err) {
    return value.toFixed(2);
  }
};

const resolveOrder = (data: unknown): OrderLike | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("order" in data) {
    const maybeOrder = (data as { order?: OrderLike }).order;
    return maybeOrder ?? null;
  }

  if ("id" in data) {
    return data as OrderLike;
  }

  return null;
};

const OrderDashboardPage = () => {
  const [orderId, setOrderId] = useState(defaultOrderId);
  const [order, setOrder] = useState<OrderLike | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async (id: string) => {
    if (!id.trim()) {
      setOrder(null);
      setError("Order id is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/store/orders/${id.trim()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load order");
      }

      const data = await response.json();
      const resolved = resolveOrder(data);

      if (!resolved) {
        throw new Error("Order response was empty");
      }

      setOrder(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder(orderId);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadOrder(orderId);
  };

  const items = useMemo(() => {
    if (!order) {
      return [];
    }

    if (Array.isArray(order.items)) {
      return order.items;
    }

    if (Array.isArray(order.order_items)) {
      return order.order_items;
    }

    return [];
  }, [order]);

  const cartLike = order?.cart ?? order;
  const currencyCode = cartLike?.currency_code ?? order?.currency_code ?? "USD";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Order Dashboard</Heading>
      </div>
      <div className="px-6 py-4">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-ui-fg-subtle">Order id</span>
            <input
              className="rounded-md border border-ui-border-base px-3 py-2"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load order"}
            </button>
          </div>
          {error && <p className="text-ui-fg-error">{error}</p>}
        </form>
      </div>
      {order && (
        <div className="px-6 py-4">
          <div className="grid gap-6">
            <div>
              <Heading level="h2">Order Summary</Heading>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Order id
                      </th>
                      <td className="py-2">{order.id}</td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Display id
                      </th>
                      <td className="py-2">
                        {order.display_id !== null &&
                        order.display_id !== undefined
                          ? order.display_id
                          : "-"}
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Status
                      </th>
                      <td className="py-2">{order.status ?? "-"}</td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Email
                      </th>
                      <td className="py-2">{order.email ?? "-"}</td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Created
                      </th>
                      <td className="py-2">{formatDateTime(order.created_at)}</td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Currency
                      </th>
                      <td className="py-2">{currencyCode}</td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Subtotal
                      </th>
                      <td className="py-2">
                        {formatAmount(cartLike?.subtotal, currencyCode)}
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Discount total
                      </th>
                      <td className="py-2">
                        {formatAmount(order.discount_total, currencyCode)}
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Tax total
                      </th>
                      <td className="py-2">
                        {formatAmount(cartLike?.tax_total, currencyCode)}
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Shipping total
                      </th>
                      <td className="py-2">
                        {formatAmount(cartLike?.shipping_total, currencyCode)}
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Service fee
                      </th>
                      <td className="py-2">
                        {formatAmount(cartLike?.service_fee, currencyCode)}
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Original total
                      </th>
                      <td className="py-2">
                        {formatAmount(order.original_total, currencyCode)}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2 pr-4 text-left text-ui-fg-subtle">
                        Total
                      </th>
                      <td className="py-2">
                        {formatAmount(cartLike?.total, currencyCode)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <Heading level="h2">Order Items</Heading>
              {items.length === 0 ? (
                <p className="mt-4 text-ui-fg-subtle">
                  No order items available.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                        <th className="py-2 pr-4">Item</th>
                        <th className="py-2 pr-4">Variant</th>
                        <th className="py-2 pr-4">SKU</th>
                        <th className="py-2 pr-4">Quantity</th>
                        <th className="py-2 pr-4">Unit price</th>
                        <th className="py-2 pr-4">Subtotal</th>
                        <th className="py-2 pr-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-ui-border-base"
                        >
                          <td className="py-2 pr-4">{item.title ?? "-"}</td>
                          <td className="py-2 pr-4">{item.subtitle ?? "-"}</td>
                          <td className="py-2 pr-4">
                            {item.variant_sku ?? "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {item.quantity ?? "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {formatAmount(item.unit_price, currencyCode)}
                          </td>
                          <td className="py-2 pr-4">
                            {formatAmount(item.subtotal, currencyCode)}
                          </td>
                          <td className="py-2 pr-4">
                            {formatAmount(item.total, currencyCode)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Order Dashboard",
  icon: Buildings,
});

export default OrderDashboardPage;
