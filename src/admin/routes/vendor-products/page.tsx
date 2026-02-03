import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useEffect, useMemo, useState } from "react";

type Vendor = {
  id: string;
  name: string;
  is_active?: boolean;
};

type Product = {
  id: string;
  title: string;
  handle?: string | null;
  status?: string | null;
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

const VendorProductsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [linkedProductIds, setLinkedProductIds] = useState<string[]>([]);
  const [productVendorMap, setProductVendorMap] = useState<
    Record<string, string>
  >({});
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingVendorProducts, setIsLoadingVendorProducts] = useState(false);
  const [isLoadingProductLinks, setIsLoadingProductLinks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [selectedVendorId, vendors]
  );

  const linkedProducts = useMemo(() => {
    if (linkedProductIds.length === 0) {
      return [];
    }
    const linkedSet = new Set(linkedProductIds);
    return products.filter((product) => linkedSet.has(product.id));
  }, [linkedProductIds, products]);

  const availableProducts = useMemo(() => {
    const linkedSet = new Set(linkedProductIds);
    return products.filter((product) => {
      if (linkedSet.has(product.id)) {
        return false;
      }

      const linkedVendorId = productVendorMap[product.id];
      if (linkedVendorId && linkedVendorId !== selectedVendorId) {
        return false;
      }

      return true;
    });
  }, [linkedProductIds, products, productVendorMap, selectedVendorId]);

  const loadVendors = async () => {
    setIsLoadingVendors(true);
    setError(null);

    try {
      const response = await fetch("/admin/vendors", {
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to load vendors"
        );
        throw new Error(message);
      }

      const data = await response.json();
      setVendors(data.vendors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    setError(null);

    try {
      const response = await fetch("/admin/products?limit=200", {
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
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadVendorProducts = async (vendorId: string) => {
    setIsLoadingVendorProducts(true);
    setError(null);

    try {
      const response = await fetch(`/admin/vendors/${vendorId}/products`, {
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
      const productIds =
        data.product_ids ??
        (data.vendor_products ?? []).map((entry: { product_id: string }) => {
          return entry.product_id;
        });
      setLinkedProductIds(productIds);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vendor products"
      );
    } finally {
      setIsLoadingVendorProducts(false);
    }
  };

  const loadProductVendorMap = async () => {
    setIsLoadingProductLinks(true);
    setError(null);

    try {
      const response = await fetch("/admin/vendor-products", {
        credentials: "include",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to load vendor product links"
        );
        throw new Error(message);
      }

      const data = await response.json();
      const map: Record<string, string> = {};
      (data.vendor_products ?? []).forEach(
        (entry: { product_id?: string; vendor_id?: string }) => {
          if (entry.product_id && entry.vendor_id) {
            map[entry.product_id] = entry.vendor_id;
          }
        }
      );
      setProductVendorMap(map);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load vendor product links"
      );
    } finally {
      setIsLoadingProductLinks(false);
    }
  };

  useEffect(() => {
    loadVendors();
    loadProducts();
    loadProductVendorMap();
  }, []);

  useEffect(() => {
    if (!selectedVendorId) {
      setLinkedProductIds([]);
      return;
    }

    loadVendorProducts(selectedVendorId);
  }, [selectedVendorId]);

  useEffect(() => {
    if (!selectedVendorId) {
      return;
    }

    if (!vendors.some((vendor) => vendor.id === selectedVendorId)) {
      setSelectedVendorId("");
      setLinkedProductIds([]);
    }
  }, [selectedVendorId, vendors]);

  const handleAddProduct = async () => {
    if (!selectedVendorId || !selectedProductId) {
      return;
    }

    setIsSaving(true);
    setError(null);

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

      await loadVendorProducts(selectedVendorId);
      await loadProductVendorMap();
      setSelectedProductId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!selectedVendorId) {
      return;
    }

    if (!window.confirm("Remove this product from the vendor?")) {
      return;
    }

    setIsSaving(true);
    setError(null);

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
          "Failed to unlink product"
        );
        throw new Error(message);
      }

      await loadVendorProducts(selectedVendorId);
      await loadProductVendorMap();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Vendor Products</Heading>
      </div>
      <div className="px-6 py-4">
        <div className="grid gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-ui-fg-subtle">Vendor</span>
            <select
              className="min-w-[240px] rounded-md border border-ui-border-base px-3 py-2"
              value={selectedVendorId}
              onChange={(event) => {
                setSelectedVendorId(event.target.value);
                setSelectedProductId("");
              }}
              disabled={isLoadingVendors || vendors.length === 0}
            >
              <option value="">Select vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-ui-fg-subtle">
            Link existing products to vendors. Products cannot be created here.
          </p>
          {error && <p className="text-ui-fg-error">{error}</p>}
        </div>
      </div>
      {selectedVendor && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Heading level="h2">Products for {selectedVendor.name}</Heading>
            <button
              className="rounded-md border border-ui-border-base px-3 py-1"
              type="button"
              onClick={() => setSelectedVendorId("")}
              disabled={isSaving}
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
                  disabled={
                    availableProducts.length === 0 ||
                    isSaving ||
                    isLoadingProducts ||
                    isLoadingProductLinks
                  }
                >
                  <option value="">Select product</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-ui-fg-subtle">
                Products linked to another vendor are hidden.
              </p>
              <button
                className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
                type="button"
                onClick={handleAddProduct}
                disabled={!selectedProductId || isSaving}
              >
                Link product
              </button>
            </div>
            {isLoadingVendorProducts ||
            isLoadingProducts ||
            isLoadingProductLinks ? (
              <p className="text-ui-fg-subtle">Loading vendor products...</p>
            ) : linkedProducts.length === 0 ? (
              <p className="text-ui-fg-subtle">
                No products linked to this vendor.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-ui-border-base text-left text-ui-fg-subtle">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Handle</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-ui-border-base"
                      >
                        <td className="py-3 pr-4">{product.title}</td>
                        <td className="py-3 pr-4">
                          {product.handle ?? "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {product.status ?? "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            className="rounded-md border border-ui-border-base px-3 py-1 text-ui-fg-error"
                            type="button"
                            onClick={() => handleRemoveProduct(product.id)}
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
      {isLoadingVendors && (
        <div className="px-6 py-4">
          <p className="text-ui-fg-subtle">Loading vendors...</p>
        </div>
      )}
      {!isLoadingVendors && vendors.length === 0 && (
        <div className="px-6 py-4">
          <p className="text-ui-fg-subtle">No vendors available.</p>
        </div>
      )}
      {!isLoadingProducts && products.length === 0 && (
        <div className="px-6 py-4">
          <p className="text-ui-fg-subtle">No products available.</p>
        </div>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Vendor Products",
  icon: Buildings,
});

export default VendorProductsPage;
