/**
 * Per-user cart key helpers.
 *
 * Logged-in users  → "lemmewear_cart_<userId>"
 * Guests           → "lemmewear_cart_guest"
 *
 * On login  : guest cart items are merged into the user cart, then guest key is cleared.
 * On logout : user cart key is left intact (so items survive a re-login on the same device).
 */

export const GUEST_CART_KEY = "lemmewear_cart_guest";
export const GUEST_CHECKOUT_KEY = "lemmewear_checkout_guest";

export function cartKey(userId?: string | null): string {
  return userId ? `lemmewear_cart_${userId}` : GUEST_CART_KEY;
}

export function checkoutKey(userId?: string | null): string {
  return userId ? `lemmewear_checkout_${userId}` : GUEST_CHECKOUT_KEY;
}

/** Read cart array from localStorage (safe). */
export function readCart(userId?: string | null): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cartKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Write cart array to localStorage and fire cart_updated event. */
export function writeCart(items: any[], userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cartKey(userId), JSON.stringify(items));
    // Defer the event so it never fires synchronously during a React render
    setTimeout(() => window.dispatchEvent(new Event("cart_updated")), 0);
  } catch {
    // ignore quota errors
  }
}

/**
 * Get the currently active cart key by reading the stored uid.
 * AuthContext writes "lemmewear_uid" on login and clears it on logout.
 */
export function activeCartKey(): string {
  if (typeof window === "undefined") return GUEST_CART_KEY;
  const uid = localStorage.getItem("lemmewear_uid");
  return cartKey(uid || null);
}

export function activeCheckoutKey(): string {
  if (typeof window === "undefined") return GUEST_CHECKOUT_KEY;
  const uid = localStorage.getItem("lemmewear_uid");
  return checkoutKey(uid || null);
}

/** Convenience: read the active user's cart. */
export function readActiveCart(): any[] {
  return readCart(typeof window !== "undefined" ? localStorage.getItem("lemmewear_uid") : null);
}

/** Convenience: write the active user's cart. */
export function writeActiveCart(items: any[]): void {
  writeCart(items, typeof window !== "undefined" ? localStorage.getItem("lemmewear_uid") : null);
}

/**
 * Merge guest cart into user cart on login.
 * Items with the same (slug + color + size) have their qty summed.
 * Guest cart is cleared afterwards.
 */
export function mergeGuestCartIntoUser(userId: string): void {
  if (typeof window === "undefined") return;
  const guestItems: any[] = readCart(null);
  if (guestItems.length === 0) return;

  const userItems: any[] = readCart(userId);

  for (const guestItem of guestItems) {
    const match = userItems.find(
      (u) =>
        u.slug === guestItem.slug &&
        u.color === guestItem.color &&
        u.size === guestItem.size
    );
    if (match) {
      match.qty = (match.qty || 1) + (guestItem.qty || 1);
    } else {
      userItems.push({ ...guestItem, id: Date.now() + Math.random() });
    }
  }

  writeCart(userItems, userId);
  localStorage.removeItem(GUEST_CART_KEY);
  localStorage.removeItem(GUEST_CHECKOUT_KEY);
}
