import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useState } from "react";

type ChargingLevel = "global" | "item_level" | "shop_level";
type ServiceFeeStatus = "active" | "pending" | "inactive";

type ServiceFee = {
  id: string;
  display_name: string;
  fee_name: string;
  charging_level: ChargingLevel;
  rate: number | string;
  valid_from?: string | null;
  valid_to?: string | null;
  status: ServiceFeeStatus;
  date_created?: string | null;
};

type ServiceFeeFormState = {
  display_name: string;
  fee_name: string;
  charging_level: ChargingLevel;
  rate: string;
  valid_from: string;
  valid_to: string;
  status: ServiceFeeStatus;
};

const defaultServiceFeeFormState: ServiceFeeFormState = {
  display_name: "",
  fee_name: "",
  charging_level: "item_level",
  rate: "",
  valid_from: "",
  valid_to: "",
  status: "pending",
};

const chargingLevelOptions: Array<{ value: ChargingLevel; label: string }> = [
  { value: "global", label: "Global" },
  { value: "item_level", label: "Item Level" },
  { value: "shop_level", label: "Shop Level" },
];

const statusOptions: Array<{ value: ServiceFeeStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

const chargingLevelLabels = Object.fromEntries(
  chargingLevelOptions.map((option) => [option.value, option.label])
) as Record<ChargingLevel, string>;

const statusLabels = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label])
) as Record<ServiceFeeStatus, string>;

const formatDateInput = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const formatDateLabel = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString();
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

const ServiceFeesPage = () => {
  const [serviceFees, setServiceFees] = useState<ServiceFee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceFeeId, setEditingServiceFeeId] = useState<string | null>(
    null
  );
  const [formState, setFormState] = useState<ServiceFeeFormState>(
    defaultServiceFeeFormState
  );
  const [lockedChargingLevel, setLockedChargingLevel] =
    useState<ChargingLevel | null>(null);

  const loadServiceFees = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/admin/service-fees", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load service fees");
      }

      const data = await response.json();
      setServiceFees(data.service_fees ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load service fees"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServiceFees();
  }, []);

  const openCreateModal = () => {
    setEditingServiceFeeId(null);
    setLockedChargingLevel(null);
    setFormState(defaultServiceFeeFormState);
    setIsModalOpen(true);
  };

  const openGlobalCreateModal = () => {
    setEditingServiceFeeId(null);
    setLockedChargingLevel("global");
    setFormState({
      ...defaultServiceFeeFormState,
      charging_level: "global",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (
    serviceFee: ServiceFee,
    lockLevel: ChargingLevel | null = null
  ) => {
    setEditingServiceFeeId(serviceFee.id);
    setLockedChargingLevel(lockLevel);
    setFormState({
      display_name: serviceFee.display_name ?? "",
      fee_name: serviceFee.fee_name ?? "",
      charging_level: serviceFee.charging_level ?? "global",
      rate:
        serviceFee.rate === null || serviceFee.rate === undefined
          ? ""
          : String(serviceFee.rate),
      valid_from: formatDateInput(serviceFee.valid_from),
      valid_to: formatDateInput(serviceFee.valid_to),
      status: serviceFee.status ?? "pending",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServiceFeeId(null);
    setLockedChargingLevel(null);
    setFormState(defaultServiceFeeFormState);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        display_name: formState.display_name.trim(),
        fee_name: formState.fee_name.trim(),
        charging_level: lockedChargingLevel ?? formState.charging_level,
        rate: Number(formState.rate),
        valid_from: formState.valid_from || undefined,
        valid_to: formState.valid_to || undefined,
        status: formState.status,
      };

      const response = await fetch(
        editingServiceFeeId
          ? `/admin/service-fees/${editingServiceFeeId}`
          : "/admin/service-fees",
        {
          method: editingServiceFeeId ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to save service fee"
        );
        throw new Error(message);
      }

      await loadServiceFees();
      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save service fee"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceFeeId: string) => {
    if (!window.confirm("Delete this service fee?")) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/admin/service-fees/${serviceFeeId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to delete service fee"
        );
        throw new Error(message);
      }

      await loadServiceFees();
      if (editingServiceFeeId === serviceFeeId) {
        closeModal();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete service fee"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const globalServiceFee = serviceFees.find(
    (serviceFee) => serviceFee.charging_level === "global"
  );
  const nonGlobalServiceFees = serviceFees.filter(
    (serviceFee) => serviceFee.charging_level !== "global"
  );
  const chargingLevelOptionsForForm =
    lockedChargingLevel === "global"
      ? chargingLevelOptions.filter((option) => option.value === "global")
      : chargingLevelOptions.filter((option) => option.value !== "global");
  const isChargingLevelLocked = lockedChargingLevel !== null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Service Fees</Heading>
        <button
          className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
          type="button"
          onClick={openCreateModal}
        >
          Add service fee
        </button>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Heading level="h2">Global charging</Heading>
          <button
            className="rounded-md border border-ui-border-base px-3 py-1"
            type="button"
            onClick={() =>
              globalServiceFee
                ? openEditModal(globalServiceFee, "global")
                : openGlobalCreateModal()
            }
            disabled={isSaving}
          >
            {globalServiceFee ? "Edit global" : "Add global"}
          </button>
        </div>
        {isLoading ? (
          <p className="mt-3 text-ui-fg-subtle">Loading global charging...</p>
        ) : globalServiceFee ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-ui-fg-subtle">Display name</p>
              <p>{globalServiceFee.display_name}</p>
            </div>
            <div>
              <p className="text-ui-fg-subtle">Fee name</p>
              <p>{globalServiceFee.fee_name}</p>
            </div>
            <div>
              <p className="text-ui-fg-subtle">Rate (%)</p>
              <p>{globalServiceFee.rate}</p>
            </div>
            <div>
              <p className="text-ui-fg-subtle">Status</p>
              <p>{statusLabels[globalServiceFee.status]}</p>
            </div>
            <div>
              <p className="text-ui-fg-subtle">Valid from</p>
              <p>{formatDateLabel(globalServiceFee.valid_from)}</p>
            </div>
            <div>
              <p className="text-ui-fg-subtle">Valid to</p>
              <p>{formatDateLabel(globalServiceFee.valid_to)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-ui-fg-subtle">
            No global charging set yet.
          </p>
        )}
      </div>
      <div className="px-6 py-4">
        {error && <p className="text-ui-fg-error">{error}</p>}
        {isLoading ? (
          <p className="text-ui-fg-subtle">Loading service fees...</p>
        ) : nonGlobalServiceFees.length === 0 ? (
          <p className="text-ui-fg-subtle">
            No item or shop level service fees yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                  <th className="py-2 pr-4">Display name</th>
                  <th className="py-2 pr-4">Fee name</th>
                  <th className="py-2 pr-4">Charging level</th>
                  <th className="py-2 pr-4">Rate (%)</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Valid from</th>
                  <th className="py-2 pr-4">Valid to</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nonGlobalServiceFees.map((serviceFee) => (
                  <tr
                    key={serviceFee.id}
                    className="border-b border-ui-border-base"
                  >
                    <td className="py-3 pr-4">{serviceFee.display_name}</td>
                    <td className="py-3 pr-4">{serviceFee.fee_name}</td>
                    <td className="py-3 pr-4">
                      {chargingLevelLabels[serviceFee.charging_level]}
                    </td>
                    <td className="py-3 pr-4">{serviceFee.rate}</td>
                    <td className="py-3 pr-4">
                      {statusLabels[serviceFee.status]}
                    </td>
                    <td className="py-3 pr-4">
                      {formatDateLabel(serviceFee.valid_from)}
                    </td>
                    <td className="py-3 pr-4">
                      {formatDateLabel(serviceFee.valid_to)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-md border border-ui-border-base px-3 py-1"
                          type="button"
                          onClick={() => openEditModal(serviceFee)}
                          disabled={isSaving}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-ui-border-base px-3 py-1 text-ui-fg-error"
                          type="button"
                          onClick={() => handleDelete(serviceFee.id)}
                          disabled={isSaving}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-lg bg-ui-bg-base p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <Heading level="h2">
                {editingServiceFeeId ? "Edit service fee" : "Add service fee"}
              </Heading>
              <button
                className="rounded-md border border-ui-border-base px-3 py-1"
                type="button"
                onClick={closeModal}
                disabled={isSaving}
              >
                Close
              </button>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-ui-fg-subtle">Display name</span>
                  <input
                    className="rounded-md border border-ui-border-base px-3 py-2"
                    required
                    value={formState.display_name}
                    onChange={(event) =>
                      setFormState((prev) => ({
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
                    required
                    value={formState.fee_name}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        fee_name: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-ui-fg-subtle">Charging level</span>
                  <select
                    className="rounded-md border border-ui-border-base px-3 py-2"
                    required
                    value={formState.charging_level}
                    disabled={isChargingLevelLocked}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        charging_level: event.target.value as ChargingLevel,
                      }))
                    }
                  >
                    {chargingLevelOptionsForForm.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-ui-fg-subtle">Rate (%)</span>
                  <input
                    className="rounded-md border border-ui-border-base px-3 py-2"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formState.rate}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        rate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-ui-fg-subtle">Status</span>
                  <select
                    className="rounded-md border border-ui-border-base px-3 py-2"
                    required
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: event.target.value as ServiceFeeStatus,
                      }))
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-ui-fg-subtle">Valid from</span>
                  <input
                    className="rounded-md border border-ui-border-base px-3 py-2"
                    type="date"
                    value={formState.valid_from}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        valid_from: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-ui-fg-subtle">Valid to</span>
                  <input
                    className="rounded-md border border-ui-border-base px-3 py-2"
                    type="date"
                    value={formState.valid_to}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        valid_to: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              {error && <p className="text-ui-fg-error">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
                  type="submit"
                  disabled={isSaving}
                >
                  {editingServiceFeeId ? "Update service fee" : "Create service fee"}
                </button>
                <button
                  className="rounded-md border border-ui-border-base px-4 py-2"
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Service Fees",
  icon: Buildings,
});

export default ServiceFeesPage;