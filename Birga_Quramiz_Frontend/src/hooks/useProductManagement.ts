"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getMySellerProducts,
  deleteMySellerProduct,
  setMySellerProductVisibility,
} from "@/lib/api/products";
import type { Product } from "@/types";

export function useProductManagement() {
  const t = useTranslations("SellerProducts");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [actionProductId, setActionProductId] = useState<string | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
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
  }, []);

  const handleToggleVisibility = async (product: Product) => {
    const activeNow = product.status === "APPROVED";
    setActionProductId(product.id);
    try {
      await setMySellerProductVisibility(product.id, !activeNow);
      toast.success(activeNow ? t("deactivated") : t("activated"));
      await loadProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setActionProductId(null);
    }
  };

  const handleDelete = (product: Product) => setDeleteConfirmProduct(product);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    const product = deleteConfirmProduct;
    setDeleteConfirmProduct(null);
    setActionProductId(product.id);
    try {
      await deleteMySellerProduct(product.id);
      toast.success(t("productDeleted"));
      await loadProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setActionProductId(null);
    }
  };

  return {
    products,
    productsLoading,
    productsError,
    actionProductId,
    deleteConfirmProduct,
    setDeleteConfirmProduct,
    loadProducts,
    handleToggleVisibility,
    handleDelete,
    handleConfirmDelete,
  };
}
