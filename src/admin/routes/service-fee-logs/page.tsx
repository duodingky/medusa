import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useState } from "react";

type ServiceFeeLog = {
  id: number;
  user?: string | null;
  display_name?: string | null;
  fee_name?: string | null;
  charging_level?: string | null;
  rate?: number | string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  status?: string | null;
  eligibility_config?: unknown;
  date_added?: string | null;
};

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

const formatEligibilityConfig = (value: unknown) => {
  if (!value) {
    return "-";
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 120
      ? `${serialized.slice(0, 117)}...`
      : serialized;
  } catch (err) {
    return "-";
  }
};

const buildQueryString = (params: Record<string, string>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const ServiceFeeLogsPage = () => {
  const [logs, setLogs] = useState<ServiceFeeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    user: "",
    display_name: "",
    fee_name: "",
    charging_level: "",
    status: "",
  });

  const loadLogs = async (
    overrideFilters?: typeof filters
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = overrideFilters ?? filters;
      const queryString = buildQueryString({
        user: activeFilters.user.trim(),
        display_name: activeFilters.display_name.trim(),
        fee_name: activeFilters.fee_name.trim(),
        charging_level: activeFilters.charging_level,
        status: activeFilters.status,
      });
      const response = await fetch(`/admin/service-fee-logs${queryString}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load service fee logs");
      }

      const data = await response.json();
      const loadedLogs = Array.isArray(data.service_fee_logs)
        ? data.service_fee_logs
        : [];
      setLogs(loadedLogs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load service fee logs"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadLogs();
  };

  const clearFilters = () => {
    const cleared = {
      user: "",
      display_name: "",
      fee_name: "",
      charging_level: "",
      status: "",
    };
    setFilters(cleared);
    loadLogs(cleared);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Service Fee Logs</Heading>
      </div>
      <div className="px-6 py-4">
        <form className="grid gap-4" onSubmit={applyFilters}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">User</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.user}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    user: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Display name</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.display_name}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    display_name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Fee name</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.fee_name}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    fee_name: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Charging level</span>
              <select
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.charging_level}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    charging_level: event.target.value,
                  }))
                }
              >
                <option value="">All</option>
                <option value="global">Global</option>
                <option value="item_level">Item level</option>
                <option value="shop_level">Shop level</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Status</span>
              <select
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
              type="submit"
              disabled={isLoading}
            >
              Apply filters
            </button>
            <button
              className="rounded-md border border-ui-border-base px-4 py-2"
              type="button"
              onClick={clearFilters}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-ui-fg-error">{error}</p>}
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <p className="text-ui-fg-subtle">Loading service fee logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-ui-fg-subtle">No service fee logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Display name</th>
                  <th className="py-2 pr-4">Fee name</th>
                  <th className="py-2 pr-4">Charging level</th>
                  <th className="py-2 pr-4">Rate</th>
                  <th className="py-2 pr-4">Valid from</th>
                  <th className="py-2 pr-4">Valid to</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Eligibility config</th>
                  <th className="py-2 pr-4">Date added</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-ui-border-base"
                  >
                    <td className="py-3 pr-4">{log.id}</td>
                    <td className="py-3 pr-4">{log.user ?? "-"}</td>
                    <td className="py-3 pr-4">{log.display_name ?? "-"}</td>
                    <td className="py-3 pr-4">{log.fee_name ?? "-"}</td>
                    <td className="py-3 pr-4">{log.charging_level ?? "-"}</td>
                    <td className="py-3 pr-4">
                      {log.rate === null || typeof log.rate === "undefined"
                        ? "-"
                        : log.rate}
                    </td>
                    <td className="py-3 pr-4">{formatDateTime(log.valid_from)}</td>
                    <td className="py-3 pr-4">{formatDateTime(log.valid_to)}</td>
                    <td className="py-3 pr-4">{log.status ?? "-"}</td>
                    <td className="py-3 pr-4">
                      {formatEligibilityConfig(log.eligibility_config)}
                    </td>
                    <td className="py-3 pr-4">
                      {formatDateTime(log.date_added)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Service Fee Logs",
  icon: Buildings,
});

export default ServiceFeeLogsPage;
