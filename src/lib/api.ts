/**
 * API client utilities for LemmeWear
 * All API calls go through these functions for consistent error handling.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `API error: ${res.status}`);
  }

  return json;
}

// ─── Products ────────────────────────────────────────────────────

export interface ProductFilters {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  style?: string;
  badge?: string;
}

export async function fetchProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return apiFetch<unknown[]>(`/api/products?${params.toString()}`);
}

export async function fetchProductBySlug(slug: string) {
  return apiFetch<unknown>(`/api/products/${slug}`);
}

export async function fetchTrendingProducts(limit = 4) {
  return apiFetch<unknown[]>(`/api/products/trending?limit=${limit}`);
}

// ─── Search ──────────────────────────────────────────────────────

export async function searchProducts(query: string, limit = 10) {
  return apiFetch<unknown[]>(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

// ─── Orders ──────────────────────────────────────────────────────

export interface CreateOrderPayload {
  items: {
    productId: string;
    name: string;
    slug: string;
    image: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount?: number;
  couponCode?: string;
  packagingType?: string;
  packagingCost?: number;
  shippingCost?: number;
  total: number;
  giftMessage?: string;
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment: {
    method: "upi" | "card" | "netbanking" | "cod";
  };
}

export async function createOrder(payload: CreateOrderPayload) {
  return apiFetch<unknown>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchOrders(email: string) {
  return apiFetch<unknown[]>(`/api/orders?email=${encodeURIComponent(email)}`);
}

export async function fetchOrder(orderNumber: string) {
  return apiFetch<unknown>(`/api/orders/${orderNumber}`);
}

export async function updateOrderStatus(
  orderNumber: string,
  updates: Record<string, unknown>
) {
  return apiFetch<unknown>(`/api/orders/${orderNumber}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// ─── Contact ─────────────────────────────────────────────────────

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function submitContact(payload: ContactPayload) {
  return apiFetch<{ id: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Reviews ─────────────────────────────────────────────────────

export interface CreateReviewPayload {
  productSlug: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
}

export async function fetchReviews(slug: string, page = 1, limit = 10) {
  return apiFetch<unknown[]>(
    `/api/reviews?slug=${slug}&page=${page}&limit=${limit}`
  );
}

export async function createReview(payload: CreateReviewPayload) {
  return apiFetch<unknown>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── User Profile ────────────────────────────────────────────────

export async function fetchUserProfile(email: string) {
  return apiFetch<unknown>(
    `/api/users/profile?email=${encodeURIComponent(email)}`
  );
}

export async function updateUserProfile(updates: Record<string, unknown>) {
  return apiFetch<unknown>("/api/users/profile", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// ─── Wishlist ────────────────────────────────────────────────────

export async function fetchWishlist(email: string) {
  return apiFetch<unknown[]>(`/api/users/wishlist?email=${encodeURIComponent(email)}`);
}

export async function addToWishlist(email: string, slug: string) {
  return apiFetch<string[]>("/api/users/wishlist", {
    method: "POST",
    body: JSON.stringify({ email, slug }),
  });
}

export async function removeFromWishlist(email: string, slug: string) {
  return apiFetch<string[]>("/api/users/wishlist", {
    method: "DELETE",
    body: JSON.stringify({ email, slug }),
  });
}

// ─── Addresses ───────────────────────────────────────────────────

export interface AddressPayload {
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export async function fetchAddresses(email: string) {
  return apiFetch<unknown[]>(`/api/users/addresses?email=${encodeURIComponent(email)}`);
}

export async function addAddress(email: string, address: AddressPayload) {
  return apiFetch<unknown[]>("/api/users/addresses", {
    method: "POST",
    body: JSON.stringify({ email, address }),
  });
}

export async function updateAddress(email: string, addressId: string, address: Partial<AddressPayload>) {
  return apiFetch<unknown[]>("/api/users/addresses", {
    method: "PATCH",
    body: JSON.stringify({ email, addressId, address }),
  });
}

export async function deleteAddress(email: string, addressId: string) {
  return apiFetch<unknown[]>("/api/users/addresses", {
    method: "DELETE",
    body: JSON.stringify({ email, addressId }),
  });
}

// ─── Saved Designs ───────────────────────────────────────────────

export interface SaveDesignPayload {
  userEmail: string;
  name: string;
  preview?: string;
  config?: Record<string, unknown>;
}

export async function fetchSavedDesigns(email: string) {
  return apiFetch<unknown[]>(`/api/users/designs?email=${encodeURIComponent(email)}`);
}

export async function saveDesign(payload: SaveDesignPayload) {
  return apiFetch<unknown>("/api/users/designs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSavedDesign(designId: string) {
  return apiFetch<unknown>("/api/users/designs", {
    method: "DELETE",
    body: JSON.stringify({ designId }),
  });
}

// ─── Seed ────────────────────────────────────────────────────────

export async function seedDatabase(secret: string) {
  return apiFetch<{ message: string }>("/api/seed", {
    method: "POST",
    body: JSON.stringify({ secret }),
  });
}
