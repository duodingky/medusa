import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useState } from "react";

type ChargingLevel = "global" | "item_level" | "shop_level";
type ServiceFeeStatus = "active" | "pending" | "inactive";

type ItemEligibilitySelection = {
  categories: string[];
  collection: string[];
};

type ItemEligibilityConfig = {
  include: ItemEligibilitySelection;
  exinclude: ItemEligibilitySelection;
};

type ShopEligibilityConfig = {
  vendors: "all" | string[];
  vendor_group?: string[];
};

type ServiceFeeEligibilityConfig =
  | ItemEligibilityConfig
  | ShopEligibilityConfig;

type ShopEligibilityState = {
  all_vendors: boolean;
  vendors: string[];
  vendor_group: string[];
};

type CategoryOption = {
  id: string;
  name?: string | null;
  title?: string | null;
  handle?: string | null;
};

type CollectionOption = {
  id: string;
  title?: string | null;
  handle?: string | null;
  name?: string | null;
};

type VendorOption = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type VendorGroupOption = {
  id: string;
  name?: string | null;
};

type ItemEligibilityTab = "categories" | "collection";
type ShopEligibilityTab = "vendors" | "vendor_group";

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
  eligibility_config?: ServiceFeeEligibilityConfig | null;
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

const defaultItemEligibilityConfig: ItemEligibilityConfig = {
  include: {
    categories: [],
    collection: [],
  },
  exinclude: {
    categories: [],
    collection: [],
  },
};

const defaultShopEligibilityState: ShopEligibilityState = {
  all_vendors: false,
  vendors: [],
  vendor_group: [],
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

const resolveOptionLabel = (
  option: CategoryOption | CollectionOption | VendorOption | VendorGroupOption
) => {
  if ("name" in option && option.name) {
    return option.name;
  }
  if ("title" in option && option.title) {
    return option.title;
  }
  if ("handle" in option && option.handle) {
    return option.handle;
  }
  return option.id;
};

const toggleSelection = (current: string[], id: string) => {
  if (current.includes(id)) {
    return current.filter((value) => value !== id);
  }
  return [...current, id];
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
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [lockedChargingLevel, setLockedChargingLevel] =
    useState<ChargingLevel | null>(null);
  const [itemEligibility, setItemEligibility] = useState<ItemEligibilityConfig>(
    defaultItemEligibilityConfig
  );
  const [shopEligibility, setShopEligibility] =
    useState<ShopEligibilityState>(defaultShopEligibilityState);
  const [includeTab, setIncludeTab] =
    useState<ItemEligibilityTab>("categories");
  const [excludeTab, setExcludeTab] =
    useState<ItemEligibilityTab>("categories");
  const [shopTab, setShopTab] = useState<ShopEligibilityTab>("vendors");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorGroups, setVendorGroups] = useState<VendorGroupOption[]>([]);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false);
  const [eligibilityLoaded, setEligibilityLoaded] = useState(false);

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

  const resetEligibilityState = () => {
    setItemEligibility(defaultItemEligibilityConfig);
    setShopEligibility(defaultShopEligibilityState);
    setIncludeTab("categories");
    setExcludeTab("categories");
    setShopTab("vendors");
  };

  const loadEligibilityOptions = async () => {
    setIsEligibilityLoading(true);
    setError(null);

    const fetchList = async (url: string, keys: string[], label: string) => {
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        throw new Error(`Failed to load ${label}`);
      }

      const data = await response.json();
      for (const key of keys) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }

      return [];
    };

    const results = await Promise.allSettled([
      fetchList(
        "/admin/product-categories",
        ["product_categories", "categories"],
        "categories"
      ),
      fetchList(
        "/admin/collections",
        ["collections", "product_collections"],
        "collections"
      ),
      fetchList("/admin/vendors", ["vendors"], "vendors"),
      fetchList("/admin/vendor-groups", ["vendor_groups"], "vendor groups"),
    ]);

    const errors: string[] = [];

    if (results[0].status === "fulfilled") {
      setCategories(results[0].value as CategoryOption[]);
    } else {
      errors.push(
        results[0].reason instanceof Error
          ? results[0].reason.message
          : "Failed to load categories"
      );
    }

    if (results[1].status === "fulfilled") {
      setCollections(results[1].value as CollectionOption[]);
    } else {
      errors.push(
        results[1].reason instanceof Error
          ? results[1].reason.message
          : "Failed to load collections"
      );
    }

    if (results[2].status === "fulfilled") {
      setVendors(results[2].value as VendorOption[]);
    } else {
      errors.push(
        results[2].reason instanceof Error
          ? results[2].reason.message
          : "Failed to load vendors"
      );
    }

    if (results[3].status === "fulfilled") {
      setVendorGroups(results[3].value as VendorGroupOption[]);
    } else {
      errors.push(
        results[3].reason instanceof Error
          ? results[3].reason.message
          : "Failed to load vendor groups"
      );
    }

    if (errors.length > 0) {
      setError(errors[0]);
    }

    setEligibilityLoaded(true);
    setIsEligibilityLoading(false);
  };

  useEffect(() => {
    loadServiceFees();
  }, []);

  useEffect(() => {
    if (isModalOpen && !eligibilityLoaded) {
      loadEligibilityOptions();
    }
  }, [isModalOpen, eligibilityLoaded]);

  const openCreateModal = () => {
    setEditingServiceFeeId(null);
    setLockedChargingLevel(null);
    setFormState(defaultServiceFeeFormState);
    setIsIndefinite(false);
    resetEligibilityState();
    setIsModalOpen(true);
  };

  const openGlobalCreateModal = () => {
    setEditingServiceFeeId(null);
    setLockedChargingLevel("global");
    setFormState({
      ...defaultServiceFeeFormState,
      charging_level: "global",
    });
    setIsIndefinite(false);
    resetEligibilityState();
    setIsModalOpen(true);
  };

  const openEditModal = (
    serviceFee: ServiceFee,
    lockLevel: ChargingLevel | null = null
  ) => {
    setEditingServiceFeeId(serviceFee.id);
    setLockedChargingLevel(lockLevel);
    const validFrom = formatDateInput(serviceFee.valid_from);
    const validTo = formatDateInput(serviceFee.valid_to);
    const shouldSaveIndefinitely = !validFrom && !validTo;
    setFormState({
      display_name: serviceFee.display_name ?? "",
      fee_name: serviceFee.fee_name ?? "",
      charging_level: serviceFee.charging_level ?? "global",
      rate:
        serviceFee.rate === null || serviceFee.rate === undefined
          ? ""
          : String(serviceFee.rate),
      valid_from: validFrom,
      valid_to: validTo,
      status: serviceFee.status ?? "pending",
    });
    setIsIndefinite(shouldSaveIndefinitely);
    const eligibilityConfig = serviceFee.eligibility_config;
    if (
      serviceFee.charging_level === "item_level" &&
      eligibilityConfig &&
      "include" in eligibilityConfig
    ) {
      setItemEligibility({
        include: {
          categories: eligibilityConfig.include?.categories ?? [],
          collection: eligibilityConfig.include?.collection ?? [],
        },
        exinclude: {
          categories: eligibilityConfig.exinclude?.categories ?? [],
          collection: eligibilityConfig.exinclude?.collection ?? [],
        },
      });
    } else {
      setItemEligibility(defaultItemEligibilityConfig);
    }

    if (
      serviceFee.charging_level === "shop_level" &&
      eligibilityConfig &&
      "vendors" in eligibilityConfig
    ) {
      if (eligibilityConfig.vendors === "all") {
        setShopEligibility({
          all_vendors: true,
          vendors: [],
          vendor_group: [],
        });
      } else {
        setShopEligibility({
          all_vendors: false,
          vendors: Array.isArray(eligibilityConfig.vendors)
            ? eligibilityConfig.vendors
            : [],
          vendor_group: eligibilityConfig.vendor_group ?? [],
        });
      }
    } else {
      setShopEligibility(defaultShopEligibilityState);
    }

    setIncludeTab("categories");
    setExcludeTab("categories");
    setShopTab("vendors");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServiceFeeId(null);
    setLockedChargingLevel(null);
    setFormState(defaultServiceFeeFormState);
    setIsIndefinite(false);
    resetEligibilityState();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const chargingLevel = lockedChargingLevel ?? formState.charging_level;
      const shouldSaveIndefinitely = isIndefinite;
      const eligibilityConfig =
        chargingLevel === "item_level"
          ? itemEligibility
          : chargingLevel === "shop_level"
            ? shopEligibility.all_vendors
              ? { vendors: "all" as const }
              : {
                  vendors: shopEligibility.vendors,
                  vendor_group: shopEligibility.vendor_group,
                }
            : null;

      const payload = {
        display_name: formState.display_name.trim(),
        fee_name: formState.fee_name.trim(),
        charging_level: chargingLevel,
        rate: Number(formState.rate),
        valid_from: shouldSaveIndefinitely
          ? undefined
          : formState.valid_from || undefined,
        valid_to: shouldSaveIndefinitely
          ? undefined
          : formState.valid_to || undefined,
        status: formState.status,
        eligibility_config: eligibilityConfig,
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

  const toggleItemEligibilitySelection = (
    section: "include" | "exinclude",
    field: "categories" | "collection",
    id: string
  ) => {
    setItemEligibility((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: toggleSelection(prev[section][field], id),
      },
    }));
  };

  const toggleShopEligibilitySelection = (
    field: "vendors" | "vendor_group",
    id: string
  ) => {
    setShopEligibility((prev) => ({
      ...prev,
      [field]: toggleSelection(prev[field], id),
    }));
  };

  const handleAllVendorsToggle = (checked: boolean) => {
    setShopEligibility((prev) => ({
      all_vendors: checked,
      vendors: checked ? [] : prev.vendors,
      vendor_group: checked ? [] : prev.vendor_group,
    }));
  };

  const globalServiceFees = serviceFees.filter(
    (serviceFee) => serviceFee.charging_level === "global"
  );
  const nonGlobalServiceFees = serviceFees.filter(
    (serviceFee) => serviceFee.charging_level !== "global"
  );
  const currentChargingLevel = lockedChargingLevel ?? formState.charging_level;
  const chargingLevelOptionsForForm =
    lockedChargingLevel === "global"
      ? chargingLevelOptions.filter((option) => option.value === "global")
      : chargingLevelOptions.filter((option) => option.value !== "global");
  const isChargingLevelLocked = lockedChargingLevel !== null;

  const renderOptionList = (
    items: Array<
      CategoryOption | CollectionOption | VendorOption | VendorGroupOption
    >,
    selected: string[],
    onToggle: (id: string) => void,
    emptyLabel: string,
    disabled = false
  ) => {
    if (!eligibilityLoaded || isEligibilityLoading) {
      return <p className="text-ui-fg-subtle">Loading options...</p>;
    }

    if (items.length === 0) {
      return <p className="text-ui-fg-subtle">{emptyLabel}</p>;
    }

    return (
      <div className="grid gap-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex items-center gap-2 ${
              disabled ? "opacity-50" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
              disabled={disabled}
            />
            <span>{resolveOptionLabel(item)}</span>
          </label>
        ))}
      </div>
    );
  };

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
            onClick={openGlobalCreateModal}
            disabled={isSaving}
          >
            Add global
          </button>
        </div>
        {isLoading ? (
          <p className="mt-3 text-ui-fg-subtle">Loading global charging...</p>
        ) : globalServiceFees.length === 0 ? (
          <p className="mt-3 text-ui-fg-subtle">
            No global charging set yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                  <th className="py-2 pr-4">Display name</th>
                  <th className="py-2 pr-4">Fee name</th>
                  <th className="py-2 pr-4">Rate (%)</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Valid from</th>
                  <th className="py-2 pr-4">Valid to</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {globalServiceFees.map((serviceFee) => (
                  <tr
                    key={serviceFee.id}
                    className="border-b border-ui-border-base"
                  >
                    <td className="py-3 pr-4">{serviceFee.display_name}</td>
                    <td className="py-3 pr-4">{serviceFee.fee_name}</td>
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
                          onClick={() => openEditModal(serviceFee, "global")}
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
              {currentChargingLevel === "item_level" && (
                <div className="rounded-md border border-ui-border-base p-4">
                  <Heading level="h3">Item eligibility</Heading>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-ui-fg-subtle">Include</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          className={`rounded-md border px-3 py-1 ${
                            includeTab === "categories"
                              ? "border-ui-border-base bg-ui-bg-subtle"
                              : "border-ui-border-base text-ui-fg-subtle"
                          }`}
                          type="button"
                          onClick={() => setIncludeTab("categories")}
                        >
                          Categories
                        </button>
                        <button
                          className={`rounded-md border px-3 py-1 ${
                            includeTab === "collection"
                              ? "border-ui-border-base bg-ui-bg-subtle"
                              : "border-ui-border-base text-ui-fg-subtle"
                          }`}
                          type="button"
                          onClick={() => setIncludeTab("collection")}
                        >
                          Collections
                        </button>
                      </div>
                      <div className="mt-3 max-h-56 overflow-y-auto pr-1">
                        {includeTab === "categories"
                          ? renderOptionList(
                              categories,
                              itemEligibility.include.categories,
                              (id) =>
                                toggleItemEligibilitySelection(
                                  "include",
                                  "categories",
                                  id
                                ),
                              "No categories found."
                            )
                          : renderOptionList(
                              collections,
                              itemEligibility.include.collection,
                              (id) =>
                                toggleItemEligibilitySelection(
                                  "include",
                                  "collection",
                                  id
                                ),
                              "No collections found."
                            )}
                      </div>
                    </div>
                    <div>
                      <p className="text-ui-fg-subtle">Exclude</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          className={`rounded-md border px-3 py-1 ${
                            excludeTab === "categories"
                              ? "border-ui-border-base bg-ui-bg-subtle"
                              : "border-ui-border-base text-ui-fg-subtle"
                          }`}
                          type="button"
                          onClick={() => setExcludeTab("categories")}
                        >
                          Categories
                        </button>
                        <button
                          className={`rounded-md border px-3 py-1 ${
                            excludeTab === "collection"
                              ? "border-ui-border-base bg-ui-bg-subtle"
                              : "border-ui-border-base text-ui-fg-subtle"
                          }`}
                          type="button"
                          onClick={() => setExcludeTab("collection")}
                        >
                          Collections
                        </button>
                      </div>
                      <div className="mt-3 max-h-56 overflow-y-auto pr-1">
                        {excludeTab === "categories"
                          ? renderOptionList(
                              categories,
                              itemEligibility.exinclude.categories,
                              (id) =>
                                toggleItemEligibilitySelection(
                                  "exinclude",
                                  "categories",
                                  id
                                ),
                              "No categories found."
                            )
                          : renderOptionList(
                              collections,
                              itemEligibility.exinclude.collection,
                              (id) =>
                                toggleItemEligibilitySelection(
                                  "exinclude",
                                  "collection",
                                  id
                                ),
                              "No collections found."
                            )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentChargingLevel === "shop_level" && (
                <div className="rounded-md border border-ui-border-base p-4">
                  <Heading level="h3">Shop eligibility</Heading>
                  <label className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={shopEligibility.all_vendors}
                      onChange={(event) =>
                        handleAllVendorsToggle(event.target.checked)
                      }
                    />
                    <span>All vendors</span>
                  </label>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`rounded-md border px-3 py-1 ${
                          shopTab === "vendors"
                            ? "border-ui-border-base bg-ui-bg-subtle"
                            : "border-ui-border-base text-ui-fg-subtle"
                        }`}
                        type="button"
                        onClick={() => setShopTab("vendors")}
                      >
                        Vendors
                      </button>
                      <button
                        className={`rounded-md border px-3 py-1 ${
                          shopTab === "vendor_group"
                            ? "border-ui-border-base bg-ui-bg-subtle"
                            : "border-ui-border-base text-ui-fg-subtle"
                        }`}
                        type="button"
                        onClick={() => setShopTab("vendor_group")}
                      >
                        Vendor groups
                      </button>
                    </div>
                    <div className="mt-3 max-h-56 overflow-y-auto pr-1">
                      {shopTab === "vendors"
                        ? renderOptionList(
                            vendors,
                            shopEligibility.vendors,
                            (id) =>
                              toggleShopEligibilitySelection("vendors", id),
                            "No vendors found.",
                            shopEligibility.all_vendors
                          )
                        : renderOptionList(
                            vendorGroups,
                            shopEligibility.vendor_group,
                            (id) =>
                              toggleShopEligibilitySelection(
                                "vendor_group",
                                id
                              ),
                            "No vendor groups found.",
                            shopEligibility.all_vendors
                          )}
                    </div>
                    {shopEligibility.all_vendors && (
                      <p className="mt-2 text-ui-fg-subtle">
                        All vendors is selected. Vendor and group selection is
                        disabled.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="rounded-md border border-ui-border-base p-4">
                <Heading level="h3">Period</Heading>
                <label className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isIndefinite}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setIsIndefinite(checked);
                      if (checked) {
                        setFormState((prev) => ({
                          ...prev,
                          valid_from: "",
                          valid_to: "",
                        }));
                      }
                    }}
                  />
                  <span>Save it indefinitely</span>
                </label>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Valid from</span>
                    <input
                      className="rounded-md border border-ui-border-base px-3 py-2"
                      type="date"
                      value={formState.valid_from}
                      disabled={isIndefinite}
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
                      disabled={isIndefinite}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          valid_to: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
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