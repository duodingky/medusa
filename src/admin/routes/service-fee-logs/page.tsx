import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useState } from "react";

type ServiceFeeLogAction = "added" | "updated" | "deleted";

type ServiceFeeLog = {
  id: string;
  service_fee_id: string;
  action: ServiceFeeLogAction;
  note: string;
  actor_id?: string | null;
  actor_type?: string | null;
  created_at?: string | null;
};

const actionLabels: Record<ServiceFeeLogAction, string> = {
  added: "Added",
  updated: "Updated",
  deleted: "Deleted",
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
    action: "",
    service_fee_id: "",
    actor_id: "",
  });

  const loadLogs = async (
    overrideFilters?: typeof filters
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = overrideFilters ?? filters;
      const queryString = buildQueryString({
        action: activeFilters.action,
        service_fee_id: activeFilters.service_fee_id.trim(),
        actor_id: activeFilters.actor_id.trim(),
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
    const cleared = { action: "", service_fee_id: "", actor_id: "" };
    setFilters(cleared);
    loadLogs(cleared);
  };

  const formatActor = (log: ServiceFeeLog) => {
    if (!log.actor_id) {
      return "-";
    }

    return log.actor_type ? `${log.actor_id} (${log.actor_type})` : log.actor_id;
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
              <span className="text-ui-fg-subtle">Action</span>
              <select
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.action}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    action: event.target.value,
                  }))
                }
              >
                <option value="">All</option>
                <option value="added">Added</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Service fee ID</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.service_fee_id}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    service_fee_id: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">User ID</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={filters.actor_id}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    actor_id: event.target.value,
                  }))
                }
              />
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
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Service fee</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Note</th>
                  <th className="py-2 pr-4">User</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-ui-border-base"
                  >
                    <td className="py-3 pr-4">{formatDateTime(log.created_at)}</td>
                    <td className="py-3 pr-4">{log.service_fee_id}</td>
                    <td className="py-3 pr-4">
                      {actionLabels[log.action] ?? log.action}
                    </td>
                    <td className="py-3 pr-4">{log.note}</td>
                    <td className="py-3 pr-4">{formatActor(log)}</td>
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
