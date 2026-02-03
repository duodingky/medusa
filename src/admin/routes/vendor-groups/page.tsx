import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useMemo, useState } from "react";

type VendorGroup = {
  id: string;
  name: string;
};

type Vendor = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
};

type VendorGroupFormState = {
  name: string;
};

const defaultVendorGroupFormState: VendorGroupFormState = {
  name: "",
};

const VendorGroupsPage = () => {
  const [vendorGroups, setVendorGroups] = useState<VendorGroup[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [groupVendors, setGroupVendors] = useState<Vendor[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VendorGroupFormState>(
    defaultVendorGroupFormState
  );
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGroupVendors, setIsLoadingGroupVendors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () => vendorGroups.find((group) => group.id === selectedGroupId) ?? null,
    [vendorGroups, selectedGroupId]
  );

  const availableVendors = useMemo(() => {
    if (!selectedGroup) {
      return vendors;
    }
    const assignedIds = new Set(groupVendors.map((vendor) => vendor.id));
    return vendors.filter((vendor) => !assignedIds.has(vendor.id));
  }, [groupVendors, selectedGroup, vendors]);

  const loadVendorGroups = async () => {
    setIsLoadingGroups(true);
    setError(null);

    try {
      const response = await fetch("/admin/vendor-groups", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load vendor groups");
      }

      const data = await response.json();
      setVendorGroups(data.vendor_groups ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vendor groups"
      );
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await fetch("/admin/vendors", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load vendors");
      }

      const data = await response.json();
      setVendors(data.vendors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    }
  };

  const loadGroupVendors = async (groupId: string) => {
    setIsLoadingGroupVendors(true);
    setError(null);

    try {
      const response = await fetch(`/admin/vendor-groups/${groupId}/vendors`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load group vendors");
      }

      const data = await response.json();
      setGroupVendors(data.vendors ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load group vendors"
      );
    } finally {
      setIsLoadingGroupVendors(false);
    }
  };

  useEffect(() => {
    loadVendorGroups();
    loadVendors();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupVendors([]);
      return;
    }

    loadGroupVendors(selectedGroupId);
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) {
      return;
    }

    if (!vendorGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(null);
      setGroupVendors([]);
    }
  }, [selectedGroupId, vendorGroups]);

  const resetForm = () => {
    setFormState(defaultVendorGroupFormState);
    setEditingGroupId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: formState.name.trim(),
      };

      const response = await fetch(
        editingGroupId
          ? `/admin/vendor-groups/${editingGroupId}`
          : "/admin/vendor-groups",
        {
          method: editingGroupId ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save vendor group");
      }

      await loadVendorGroups();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save vendor group"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (group: VendorGroup) => {
    setEditingGroupId(group.id);
    setFormState({ name: group.name ?? "" });
  };

  const handleDelete = async (groupId: string) => {
    if (!window.confirm("Delete this vendor group?")) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/admin/vendor-groups/${groupId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor group");
      }

      await loadVendorGroups();
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
        setGroupVendors([]);
      }
      if (editingGroupId === groupId) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete vendor group"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageVendors = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedVendorId("");
  };

  const handleAddVendor = async () => {
    if (!selectedGroupId || !selectedVendorId) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/admin/vendor-groups/${selectedGroupId}/vendors`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vendor_id: selectedVendorId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add vendor to group");
      }

      await loadGroupVendors(selectedGroupId);
      setSelectedVendorId("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add vendor to group"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveVendor = async (vendorId: string) => {
    if (!selectedGroupId) {
      return;
    }

    if (!window.confirm("Remove this vendor from the group?")) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/admin/vendor-groups/${selectedGroupId}/vendors/${vendorId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove vendor from group");
      }

      await loadGroupVendors(selectedGroupId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove vendor from group"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Vendor Groups</Heading>
      </div>
      <div className="px-6 py-4">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-ui-fg-subtle">Group name</span>
            <input
              className="rounded-md border border-ui-border-base px-3 py-2"
              required
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>
          {error && <p className="text-ui-fg-error">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
              type="submit"
              disabled={isSaving}
            >
              {editingGroupId ? "Update group" : "Create group"}
            </button>
            {editingGroupId && (
              <button
                className="rounded-md border border-ui-border-base px-4 py-2"
                type="button"
                onClick={resetForm}
                disabled={isSaving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="px-6 py-4">
        {isLoadingGroups ? (
          <p className="text-ui-fg-subtle">Loading vendor groups...</p>
        ) : vendorGroups.length === 0 ? (
          <p className="text-ui-fg-subtle">No vendor groups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorGroups.map((group) => (
                  <tr
                    key={group.id}
                    className="border-b border-ui-border-base"
                  >
                    <td className="py-3 pr-4">{group.name}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-md border border-ui-border-base px-3 py-1"
                          type="button"
                          onClick={() => handleEdit(group)}
                          disabled={isSaving}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-ui-border-base px-3 py-1"
                          type="button"
                          onClick={() => handleManageVendors(group.id)}
                          disabled={isSaving}
                        >
                          Manage vendors
                        </button>
                        <button
                          className="rounded-md border border-ui-border-base px-3 py-1 text-ui-fg-error"
                          type="button"
                          onClick={() => handleDelete(group.id)}
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
      {selectedGroup && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Heading level="h2">Vendors in {selectedGroup.name}</Heading>
            <button
              className="rounded-md border border-ui-border-base px-3 py-1"
              type="button"
              onClick={() => setSelectedGroupId(null)}
              disabled={isSaving}
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-ui-fg-subtle">Add vendor</span>
                <select
                  className="min-w-[240px] rounded-md border border-ui-border-base px-3 py-2"
                  value={selectedVendorId}
                  onChange={(event) => setSelectedVendorId(event.target.value)}
                  disabled={availableVendors.length === 0 || isSaving}
                >
                  <option value="">Select vendor</option>
                  {availableVendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
                type="button"
                onClick={handleAddVendor}
                disabled={!selectedVendorId || isSaving}
              >
                Add vendor
              </button>
            </div>
            {isLoadingGroupVendors ? (
              <p className="text-ui-fg-subtle">Loading group vendors...</p>
            ) : groupVendors.length === 0 ? (
              <p className="text-ui-fg-subtle">No vendors in this group.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                      <th className="py-2 pr-4">Vendor</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupVendors.map((vendor) => (
                      <tr
                        key={vendor.id}
                        className="border-b border-ui-border-base"
                      >
                        <td className="py-3 pr-4">{vendor.name}</td>
                        <td className="py-3 pr-4">
                          {vendor.is_active ? "Active" : "Inactive"}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            className="rounded-md border border-ui-border-base px-3 py-1 text-ui-fg-error"
                            type="button"
                            onClick={() => handleRemoveVendor(vendor.id)}
                            disabled={isSaving}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Vendor Groups",
  icon: Buildings,
});

export default VendorGroupsPage;
