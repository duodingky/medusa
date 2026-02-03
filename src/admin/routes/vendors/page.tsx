import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Vendor = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  is_active?: boolean;
};

type Product = {
  id: string;
  title?: string | null;
  status?: string | null;
};

type VendorProduct = {
  vendor_id: string;
  product_id: string;
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
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VendorFormState>(
    defaultVendorFormState
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingVendorProducts, setIsLoadingVendorProducts] = useState(false);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [selectedVendorId, vendors]
  );
  const selectedVendorLinks = useMemo(() => {
    if (!selectedVendorId) {
      return [];
    }
    return vendorProducts.filter(
      (vendorProduct) => vendorProduct.vendor_id === selectedVendorId
    );
  }, [selectedVendorId, vendorProducts]);
  const assignedProductIds = useMemo(
    () => new Set(vendorProducts.map((vendorProduct) => vendorProduct.product_id)),
    [vendorProducts]
  );
  const productById = useMemo(() => {
    const entries = products.map((product) => [product.id, product] as const);
    return new Map(entries);
  }, [products]);
  const availableProducts = useMemo(
    () => products.filter((product) => !assignedProductIds.has(product.id)),
    [assignedProductIds, products]
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

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    setLinkError(null);

    try {
      const response = await fetch("/admin/products?limit=1000", {
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to load products"
        );
        throw new Error(message);
      }

      const data = await response.json();
      setProducts(data.products ?? []);
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Failed to load products"
      );
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadVendorProducts = async () => {
    setIsLoadingVendorProducts(true);
    setLinkError(null);

    try {
      const response = await fetch("/admin/vendor-products", {
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to load vendor products"
        );
        throw new Error(message);
      }

      const data = await response.json();
      setVendorProducts(data.vendor_products ?? []);
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Failed to load vendor products"
      );
    } finally {
      setIsLoadingVendorProducts(false);
    }
  };

  useEffect(() => {
    loadVendors();
    loadProducts();
    loadVendorProducts();
  }, []);

  useEffect(() => {
    if (!selectedVendorId) {
      return;
    }

    if (!vendors.some((vendor) => vendor.id === selectedVendorId)) {
      setSelectedVendorId(null);
      setSelectedProductId("");
    }
  }, [selectedVendorId, vendors]);

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
      await loadVendorProducts();
      if (editingVendorId === vendorId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageProducts = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setSelectedProductId("");
    setLinkError(null);
  };

  const handleAddProduct = async () => {
    if (!selectedVendorId || !selectedProductId) {
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      const response = await fetch(
        `/admin/vendors/${selectedVendorId}/products`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product_id: selectedProductId }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to link product"
        );
        throw new Error(message);
      }

      await loadVendorProducts();
      setSelectedProductId("");
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Failed to link product"
      );
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!selectedVendorId) {
      return;
    }

    if (!window.confirm("Remove this product from the vendor?")) {
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      const response = await fetch(
        `/admin/vendors/${selectedVendorId}/products/${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to remove product"
        );
        throw new Error(message);
      }

      await loadVendorProducts();
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Failed to remove product"
      );
    } finally {
      setIsLinking(false);
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
                          className="rounded-md border border-ui-border-base px-3 py-1"
                          type="button"
                          onClick={() => handleManageProducts(vendor.id)}
                          disabled={isSaving}
                        >
                          Manage products
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
      {selectedVendor && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Heading level="h2">Products for {selectedVendor.name}</Heading>
            <button
              className="rounded-md border border-ui-border-base px-3 py-1"
              type="button"
              onClick={() => setSelectedVendorId(null)}
              disabled={isLinking}
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-ui-fg-subtle">Add product</span>
                <select
                  className="min-w-[240px] rounded-md border border-ui-border-base px-3 py-2"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  disabled={availableProducts.length === 0 || isLinking}
                >
                  <option value="">Select product</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title ?? product.id}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
                type="button"
                onClick={handleAddProduct}
                disabled={!selectedProductId || isLinking}
              >
                Add product
              </button>
            </div>
            {linkError && <p className="text-ui-fg-error">{linkError}</p>}
            {isLoadingProducts || isLoadingVendorProducts ? (
              <p className="text-ui-fg-subtle">Loading vendor products...</p>
            ) : selectedVendorLinks.length === 0 ? (
              <p className="text-ui-fg-subtle">
                No products linked to this vendor.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVendorLinks.map((link) => {
                      const product = productById.get(link.product_id);
                      return (
                        <tr
                          key={link.product_id}
                          className="border-b border-ui-border-base"
                        >
                          <td className="py-3 pr-4">
                            {product?.title ?? link.product_id}
                          </td>
                          <td className="py-3 pr-4">
                            {product?.status ?? "-"}
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              className="rounded-md border border-ui-border-base px-3 py-1 text-ui-fg-error"
                              type="button"
                              onClick={() => handleRemoveProduct(link.product_id)}
                              disabled={isLinking}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
  label: "Vendors",
  icon: Buildings,
});

export default VendorsPage;
