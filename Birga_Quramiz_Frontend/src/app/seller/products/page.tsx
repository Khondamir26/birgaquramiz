"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteMySellerProduct,
  getMySellerProducts,
  setMySellerProductVisibility,
  updateMySellerProduct,
} from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
};

const initialForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
};

export default function SellerProductsPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [actionProductId, setActionProductId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ProductFormState>(initialForm);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingPreview, setEditingPreview] = useState("");
  const [editingLoading, setEditingLoading] = useState(false);

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingId) || null,
    [products, editingId],
  );

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const data = await getMySellerProducts();
      setProducts(data);
    } catch (err: unknown) {
      setProductsError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "SELLER") {
      router.push("/");
      return;
    }

    void loadProducts();
  }, [user, isAuthenticated, isInitialized, router]);

  const handleCreateImage = (file: File | null) => {
    if (!file) return;
    if (createPreview) {
      URL.revokeObjectURL(createPreview);
    }

    setCreateImageFile(file);
    setCreatePreview(URL.createObjectURL(file));
  };

  const handleEditImage = (file: File | null) => {
    if (!file) return;
    if (editingPreview) {
      URL.revokeObjectURL(editingPreview);
    }

    setEditingImageFile(file);
    setEditingPreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!createImageFile) {
      setError("Product image is required");
      return;
    }

    setLoading(true);

    try {
      await createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        image: createImageFile,
      });

      setSuccess("Product submitted for moderation.");
      setForm(initialForm);
      setCreateImageFile(null);
      if (createPreview) {
        URL.revokeObjectURL(createPreview);
        setCreatePreview("");
      }
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (product: Product) => {
    if (editingPreview) {
      URL.revokeObjectURL(editingPreview);
      setEditingPreview("");
    }

    setEditingImageFile(null);
    setEditingId(product.id);
    setEditingForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setEditingLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateMySellerProduct(editingId, {
        name: editingForm.name,
        description: editingForm.description,
        price: Number(editingForm.price),
        stock: Number(editingForm.stock),
        image: editingImageFile ?? undefined,
      });

      setSuccess("Product updated and sent for moderation again.");
      setEditingId(null);
      setEditingImageFile(null);
      if (editingPreview) {
        URL.revokeObjectURL(editingPreview);
        setEditingPreview("");
      }
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setEditingLoading(false);
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    const activeNow = product.status === "APPROVED";
    setActionProductId(product.id);
    setError("");
    setSuccess("");

    try {
      await setMySellerProductVisibility(product.id, !activeNow);
      setSuccess(
        activeNow
          ? "Product deactivated."
          : "Product sent for activation review.",
      );
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setActionProductId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    const ok = window.confirm(`Delete product "${product.name}"?`);
    if (!ok) return;

    setActionProductId(product.id);
    setError("");
    setSuccess("");

    try {
      await deleteMySellerProduct(product.id);
      setSuccess("Product deleted.");
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setActionProductId(null);
    }
  };

  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="page-shell max-w-3xl">
        <div className="surface-card h-48 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") {
    return null;
  }

  return (
    <div className="page-shell max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-primary">Seller Products</h1>
        <Link href="/seller/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
          Back to panel
        </Link>
      </div>

      <div className="surface-card bg-secondary/55 p-4 text-sm text-primary">Add products, upload photos from your computer and manage your catalog.</div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {success && <p className="text-sm font-medium text-green-700">{success}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <form onSubmit={handleCreate} className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-bold text-primary">Add product</h2>

          <input
            name="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
            placeholder="Product name"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            required
            rows={3}
            className="w-full resize-none rounded-lg border border-border/80 bg-white px-3 py-2 text-sm"
            placeholder="Detailed product description"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleCreateImage(e.target.files?.[0] || null)}
            className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 py-2 text-sm"
            required
          />

          {createPreview && <img src={createPreview} alt="New product preview" className="h-36 w-full rounded-lg object-cover" />}

          <div className="grid grid-cols-2 gap-4">
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              required
              className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
              placeholder="Price"
            />
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
              required
              className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
              placeholder="Stock"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !createImageFile}>
            {loading ? "Submitting..." : "Submit product"}
          </Button>
        </form>

        <section className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-bold text-primary">My products</h2>

          {productsLoading ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
            </div>
          ) : productsError ? (
            <p className="text-sm text-destructive">{productsError}</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const active = product.status === "APPROVED";
                const actionBusy = actionProductId === product.id;

                return (
                  <article key={product.id} className="rounded-xl border border-border/70 bg-white p-3">
                    <div className="flex items-start gap-3">
                      {product.imageUrl ? (
                        <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className="h-16 w-16 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">No image</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-primary">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.price.toLocaleString()} UZS • Stock {product.stock}</p>
                        <p className={`mt-1 text-xs font-medium ${active ? "text-green-700" : "text-amber-700"}`}>
                          Status: {product.status}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(product)} disabled={actionBusy}>Edit</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleToggleVisibility(product)}
                        disabled={actionBusy}
                      >
                        {actionBusy ? "Please wait..." : active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(product)}
                        disabled={actionBusy}
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {editingProduct && (
        <form onSubmit={handleSaveEdit} className="surface-card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Edit: {editingProduct.name}</h2>
            <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Close</Button>
          </div>

          <input
            value={editingForm.name}
            onChange={(e) => setEditingForm((p) => ({ ...p, name: e.target.value }))}
            className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
            required
          />

          <textarea
            value={editingForm.description}
            onChange={(e) => setEditingForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full resize-none rounded-lg border border-border/80 bg-white px-3 py-2 text-sm"
            required
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleEditImage(e.target.files?.[0] || null)}
            className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 py-2 text-sm"
          />

          {(editingPreview || editingProduct.imageUrl) && (
            <img
              src={editingPreview || resolveImageUrl(editingProduct.imageUrl)}
              alt="Edit preview"
              className="h-40 w-full rounded-lg object-cover"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              min="0"
              step="0.01"
              value={editingForm.price}
              onChange={(e) => setEditingForm((p) => ({ ...p, price: e.target.value }))}
              className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
              required
            />
            <input
              type="number"
              min="0"
              value={editingForm.stock}
              onChange={(e) => setEditingForm((p) => ({ ...p, stock: e.target.value }))}
              className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
              required
            />
          </div>

          <Button type="submit" disabled={editingLoading}>
            {editingLoading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      )}
    </div>
  );
}
