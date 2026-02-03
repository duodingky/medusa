import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useState } from "react";

type Vendor = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  is_active?: boolean;
};

type VendorFormState = {
  name: string;
  email: string;
  phone: string;
  description: string;
  is_active: boolean;
};

const defaultVendorFormState: VendorFormState = {
  name: "",
  email: "",
  phone: "",
  description: "",
  is_active: true,
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

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VendorFormState>(
    defaultVendorFormState
  );

  const loadVendors = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/admin/vendors", {
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to load vendors");
        throw new Error(message);
      }

      const data = await response.json();
      setVendors(data.vendors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const resetForm = () => {
    setFormState(defaultVendorFormState);
    setEditingVendorId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        ...formState,
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        description: formState.description.trim() || undefined,
      };

      const response = await fetch(
        editingVendorId ? `/admin/vendors/${editingVendorId}` : "/admin/vendors",
        {
          method: editingVendorId ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to save vendor");
        throw new Error(message);
      }

      await loadVendors();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setFormState({
      name: vendor.name ?? "",
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      description: vendor.description ?? "",
      is_active: vendor.is_active ?? true,
    });
  };

  const handleDelete = async (vendorId: string) => {
    if (!window.confirm("Delete this vendor?")) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/admin/vendors/${vendorId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to delete vendor"
        );
        throw new Error(message);
      }

      await loadVendors();
      if (editingVendorId === vendorId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Vendors</Heading>
      </div>
      <div className="px-6 py-4">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Name</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                required
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Email</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-ui-fg-subtle">Phone</span>
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-ui-fg-subtle">Description</span>
            <textarea
              className="min-h-[96px] rounded-md border border-ui-border-base px-3 py-2"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formState.is_active}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  is_active: event.target.checked,
                }))
              }
            />
            <span className="text-ui-fg-subtle">Active</span>
          </label>
          {error && <p className="text-ui-fg-error">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
              type="submit"
              disabled={isSaving}
            >
              {editingVendorId ? "Update vendor" : "Create vendor"}
            </button>
            {editingVendorId && (
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
        {isLoading ? (
          <p className="text-ui-fg-subtle">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <p className="text-ui-fg-subtle">No vendors yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b border-ui-border-base"
                  >
                    <td className="py-3 pr-4">{vendor.name}</td>
                    <td className="py-3 pr-4">{vendor.email ?? "-"}</td>
                    <td className="py-3 pr-4">{vendor.phone ?? "-"}</td>
                    <td className="py-3 pr-4">
                      {vendor.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-md border border-ui-border-base px-3 py-1"
                          type="button"
                          onClick={() => handleEdit(vendor)}
                          disabled={isSaving}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-ui-border-base px-3 py-1 text-ui-fg-error"
                          type="button"
                          onClick={() => handleDelete(vendor.id)}
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
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Vendors",
  icon: Buildings,
});

export default VendorsPage;
