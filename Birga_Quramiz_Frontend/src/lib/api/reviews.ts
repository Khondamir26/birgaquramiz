import { apiFetch } from "./client";

export interface CreateReviewData {
  productId: string;
  rating: number;
  pros?: string;
  cons?: string;
  comment?: string;
  images?: string[];
}

export const reviewsApi = {
  create: async (data: CreateReviewData) => {
    return apiFetch("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getByProductId: async (productId: string) => {
    return apiFetch(`/reviews/product/${productId}`);
  },
};
