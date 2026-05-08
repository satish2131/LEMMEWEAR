import { IOrder } from "@/models/Order";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

const paymentLabel: Record<string, string> = {
  upi: "UPI",
  card: "Credit / Debit Card",
  netbanking: "Net Banking",
  cod: "Cash on Delivery",
};

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: "#16a34a",
    processing: "#d97706",
    shipped: "#2563eb",
    delivered: "#16a34a",
    cancelled: "#dc2626",
  };
  return `<span style="background:${colors[status] ?? "#6b7280"};color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize;">${status}</span>`;
};

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>LemmeWear Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#111111;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:3px;font-family:Arial,sans-serif;">LEMMEWEAR</h1>
              <p style="margin:6px 0 0;color:#999999;font-size:12px;letter-spacing:1px;font-family:Arial,sans-serif;">WEAR YOUR IDENTITY</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;font-family:Arial,Helvetica,sans-serif;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0 0 6px;color:#71717a;font-size:12px;font-family:Arial,sans-serif;">
                You received this email because you placed an order on LemmeWear.
              </p>
              <p style="margin:0 0 6px;color:#71717a;font-size:12px;font-family:Arial,sans-serif;">
                &copy; ${new Date().getFullYear()} LemmeWear &middot; Andheri West, Mumbai, Maharashtra 400058
              </p>
              <p style="margin:0;color:#a1a1aa;font-size:11px;font-family:Arial,sans-serif;">
                hello@lemmewear.in
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Items table (HTML) ───────────────────────────────────────────────────────
function itemsTableHtml(order: IOrder) {
  const rows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">
        <p style="margin:0;font-weight:700;color:#111111;font-size:14px;">${item.name}</p>
        <p style="margin:3px 0 0;color:#71717a;font-size:12px;">${item.color} &middot; Size ${item.size} &middot; Qty ${item.quantity}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;color:#111111;font-size:14px;white-space:nowrap;font-family:Arial,sans-serif;">
        ${fmt(item.price * item.quantity)}
      </td>
    </tr>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <thead>
      <tr>
        <th style="padding:8px 0;text-align:left;font-size:11px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e4e4e7;font-family:Arial,sans-serif;">Item</th>
        <th style="padding:8px 0;text-align:right;font-size:11px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e4e4e7;font-family:Arial,sans-serif;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─── Items table (plain text) ─────────────────────────────────────────────────
function itemsTableText(order: IOrder) {
  return order.items
    .map(
      (item) =>
        `  - ${item.name} (${item.color}, Size ${item.size}, Qty ${item.quantity}) — ${fmt(item.price * item.quantity)}`
    )
    .join("\n");
}

// ─── Totals block (HTML) ──────────────────────────────────────────────────────
function totalsBlockHtml(order: IOrder) {
  const rows: [string, string][] = [["Subtotal", fmt(order.subtotal)]];
  if (order.discount > 0) rows.push(["Discount", `- ${fmt(order.discount)}`]);
  if (order.shippingCost > 0) rows.push(["Shipping", fmt(order.shippingCost)]);
  if (order.packagingCost > 0)
    rows.push([`Packaging (${order.packagingType})`, fmt(order.packagingCost)]);

  const lines = rows
    .map(
      ([label, val]) => `
    <tr>
      <td style="padding:4px 0;color:#71717a;font-size:13px;font-family:Arial,sans-serif;">${label}</td>
      <td style="padding:4px 0;text-align:right;color:#71717a;font-size:13px;font-family:Arial,sans-serif;">${val}</td>
    </tr>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:12px;">
    <tbody>
      ${lines}
      <tr>
        <td style="padding:10px 0 0;font-weight:700;font-size:16px;color:#111111;border-top:2px solid #e4e4e7;font-family:Arial,sans-serif;">Total</td>
        <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;color:#111111;border-top:2px solid #e4e4e7;font-family:Arial,sans-serif;">${fmt(order.total)}</td>
      </tr>
    </tbody>
  </table>`;
}

// ─── Totals block (plain text) ────────────────────────────────────────────────
function totalsBlockText(order: IOrder) {
  const lines = [`  Subtotal: ${fmt(order.subtotal)}`];
  if (order.discount > 0) lines.push(`  Discount: - ${fmt(order.discount)}`);
  if (order.shippingCost > 0) lines.push(`  Shipping: ${fmt(order.shippingCost)}`);
  if (order.packagingCost > 0)
    lines.push(`  Packaging (${order.packagingType}): ${fmt(order.packagingCost)}`);
  lines.push(`  ─────────────────────`);
  lines.push(`  Total: ${fmt(order.total)}`);
  return lines.join("\n");
}

// ─── Shipping block (HTML) ────────────────────────────────────────────────────
function shippingBlockHtml(order: IOrder) {
  const s = order.shipping;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border-radius:6px;margin-top:4px;">
    <tr>
      <td style="padding:16px 20px;font-family:Arial,sans-serif;">
        <p style="margin:0 0 8px;font-weight:700;font-size:12px;color:#111111;text-transform:uppercase;letter-spacing:0.5px;">Shipping Address</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">
          ${s.fullName}<br />
          ${s.address}<br />
          ${s.city}, ${s.state} - ${s.pincode}<br />
          Phone: ${s.phone}<br />
          Email: ${s.email}
        </p>
      </td>
    </tr>
  </table>`;
}

// ─── Payment block (HTML) ─────────────────────────────────────────────────────
function paymentBlockHtml(order: IOrder) {
  const isCod = order.payment.method === "cod";
  const isPaid = order.payment.status === "paid";
  const statusColor = isPaid ? "#16a34a" : isCod ? "#d97706" : "#6b7280";
  const statusBg    = isPaid ? "#f0fdf4" : isCod ? "#fffbeb" : "#f9f9f9";
  const statusBorder = isPaid ? "#bbf7d0" : isCod ? "#fde68a" : "#e4e4e7";

  const rzpPaymentId = (order.payment as any).razorpayPaymentId;
  const rzpOrderId   = (order.payment as any).razorpayOrderId;

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:${statusBg};border:1px solid ${statusBorder};border-radius:6px;margin-top:12px;">
    <tr>
      <td style="padding:16px 20px;font-family:Arial,sans-serif;">
        <p style="margin:0 0 10px;font-weight:700;font-size:12px;color:#111111;text-transform:uppercase;letter-spacing:0.5px;">Payment Details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color:#555555;font-size:13px;padding:3px 0;width:40%;">Method</td>
            <td style="color:#111111;font-size:13px;font-weight:700;text-align:right;">
              ${paymentLabel[order.payment.method] ?? order.payment.method}
            </td>
          </tr>
          <tr>
            <td style="color:#555555;font-size:13px;padding:3px 0;">Status</td>
            <td style="text-align:right;">
              <span style="background:${statusColor};color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:capitalize;">
                ${order.payment.status}
              </span>
            </td>
          </tr>
          <tr>
            <td style="color:#555555;font-size:13px;padding:3px 0;">Amount Paid</td>
            <td style="color:#111111;font-size:13px;font-weight:700;text-align:right;">${fmt(order.total)}</td>
          </tr>
          ${rzpPaymentId ? `
          <tr>
            <td style="color:#555555;font-size:13px;padding:3px 0;">Transaction ID</td>
            <td style="color:#111111;font-size:12px;font-weight:600;text-align:right;font-family:monospace;">${rzpPaymentId}</td>
          </tr>` : ""}
          ${rzpOrderId ? `
          <tr>
            <td style="color:#555555;font-size:13px;padding:3px 0;">Razorpay Order</td>
            <td style="color:#111111;font-size:12px;font-weight:600;text-align:right;font-family:monospace;">${rzpOrderId}</td>
          </tr>` : ""}
          ${isCod ? `
          <tr>
            <td colspan="2" style="padding-top:8px;">
              <p style="margin:0;font-size:12px;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:4px;padding:8px 12px;">
                Pay cash when your order is delivered. Keep exact change ready.
              </p>
            </td>
          </tr>` : ""}
        </table>
      </td>
    </tr>
  </table>`;
}

// ─── 1. Customer confirmation email ──────────────────────────────────────────
export function customerOrderEmail(order: IOrder): { html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lemmewear.in";
  const trackUrl = `${appUrl}/order-confirmation?order=${order.orderNumber}`;
  const deliveryStr = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // ── HTML ──
  const htmlContent = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#111111;font-family:Arial,sans-serif;">Order Confirmed</h2>
    <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
      Hi ${order.shipping.fullName}, thank you for your order. We have received it and it is being prepared for dispatch.
    </p>

    <!-- Order meta -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;font-family:Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <p style="margin:0;font-size:11px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Order Number</p>
                <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#111111;font-family:Arial,sans-serif;">${order.orderNumber}</p>
              </td>
              <td style="text-align:right;vertical-align:top;">
                ${statusBadge(order.status)}
                ${deliveryStr ? `<p style="margin:6px 0 0;font-size:12px;color:#71717a;font-family:Arial,sans-serif;">Est. delivery: ${deliveryStr}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Items -->
    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111111;font-family:Arial,sans-serif;">Order Summary</p>
    ${itemsTableHtml(order)}
    ${totalsBlockHtml(order)}

    <div style="height:24px;"></div>

    ${shippingBlockHtml(order)}
    ${paymentBlockHtml(order)}

    ${
      order.giftMessage
        ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;margin-top:12px;">
      <tr>
        <td style="padding:16px 20px;font-family:Arial,sans-serif;">
          <p style="margin:0 0 4px;font-weight:700;font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Gift Message</p>
          <p style="margin:0;color:#78350f;font-size:14px;font-style:italic;">"${order.giftMessage}"</p>
        </td>
      </tr>
    </table>`
        : ""
    }

    <div style="height:28px;"></div>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:6px;background:#111111;text-align:center;">
          <a href="${trackUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.5px;">
            Track Your Order
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;text-align:center;font-family:Arial,sans-serif;">
      Questions? Email us at hello@lemmewear.in
    </p>
  `;

  // ── Plain text (critical for spam score) ──
  const text = `
Order Confirmed - LemmeWear
===========================

Hi ${order.shipping.fullName},

Thank you for your order. We have received it and it is being prepared for dispatch.

ORDER NUMBER: ${order.orderNumber}
STATUS: ${order.status.toUpperCase()}
${deliveryStr ? `ESTIMATED DELIVERY: ${deliveryStr}` : ""}

ITEMS ORDERED
─────────────
${itemsTableText(order)}

PRICING
───────
${totalsBlockText(order)}

SHIPPING ADDRESS
────────────────
  ${order.shipping.fullName}
  ${order.shipping.address}
  ${order.shipping.city}, ${order.shipping.state} - ${order.shipping.pincode}
  Phone: ${order.shipping.phone}
  Email: ${order.shipping.email}

PAYMENT
───────
  Method: ${paymentLabel[order.payment.method] ?? order.payment.method}
  Status: ${order.payment.status}

${order.giftMessage ? `GIFT MESSAGE\n────────────\n  "${order.giftMessage}"\n` : ""}
Track your order: ${trackUrl}

─────────────────────────────────────────
LemmeWear | Andheri West, Mumbai 400058
hello@lemmewear.in
You received this email because you placed an order on lemmewear.in
`.trim();

  return { html: layout(htmlContent), text };
}

// ─── 2. Admin notification email ──────────────────────────────────────────────
export function adminOrderEmail(order: IOrder): { html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lemmewear.in";
  const adminUrl = `${appUrl}/admin/orders`;
  const placedAt = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // ── HTML ──
  const htmlContent = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#111111;font-family:Arial,sans-serif;">New Order Received</h2>
    <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
      A new order has been placed on LemmeWear. Review the details below.
    </p>

    <!-- Order meta -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;font-family:Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <p style="margin:0;font-size:11px;color:#2563eb;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Order Number</p>
                <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#111111;font-family:Arial,sans-serif;">${order.orderNumber}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#71717a;font-family:Arial,sans-serif;">Placed: ${placedAt}</p>
              </td>
              <td style="text-align:right;vertical-align:top;">
                ${statusBadge(order.status)}
                <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#111111;font-family:Arial,sans-serif;">${fmt(order.total)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Customer info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border-radius:6px;margin-bottom:16px;">
      <tr>
        <td style="padding:16px 20px;font-family:Arial,sans-serif;">
          <p style="margin:0 0 10px;font-weight:700;font-size:12px;color:#111111;text-transform:uppercase;letter-spacing:0.5px;">Customer</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#555555;font-size:14px;padding:3px 0;font-family:Arial,sans-serif;">Name</td>
              <td style="color:#111111;font-size:14px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${order.shipping.fullName}</td>
            </tr>
            <tr>
              <td style="color:#555555;font-size:14px;padding:3px 0;font-family:Arial,sans-serif;">Email</td>
              <td style="color:#111111;font-size:14px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${order.shipping.email}</td>
            </tr>
            <tr>
              <td style="color:#555555;font-size:14px;padding:3px 0;font-family:Arial,sans-serif;">Phone</td>
              <td style="color:#111111;font-size:14px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${order.shipping.phone}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Items -->
    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111111;font-family:Arial,sans-serif;">Items Ordered</p>
    ${itemsTableHtml(order)}
    ${totalsBlockHtml(order)}

    <div style="height:20px;"></div>

    ${shippingBlockHtml(order)}
    ${paymentBlockHtml(order)}

    ${
      order.couponCode
        ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-top:12px;">
      <tr>
        <td style="padding:12px 20px;font-family:Arial,sans-serif;">
          <p style="margin:0;font-size:13px;color:#16a34a;">Coupon applied: <strong>${order.couponCode}</strong> — saved ${fmt(order.discount)}</p>
        </td>
      </tr>
    </table>`
        : ""
    }

    ${
      order.giftMessage
        ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;margin-top:12px;">
      <tr>
        <td style="padding:16px 20px;font-family:Arial,sans-serif;">
          <p style="margin:0 0 4px;font-weight:700;font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Gift Message</p>
          <p style="margin:0;color:#78350f;font-size:14px;font-style:italic;">"${order.giftMessage}"</p>
        </td>
      </tr>
    </table>`
        : ""
    }

    <div style="height:28px;"></div>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:6px;background:#111111;text-align:center;">
          <a href="${adminUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.5px;">
            View in Admin Panel
          </a>
        </td>
      </tr>
    </table>
  `;

  // ── Plain text ──
  const text = `
New Order Received - LemmeWear
===============================

Order Number: ${order.orderNumber}
Placed: ${placedAt}
Total: ${fmt(order.total)}
Status: ${order.status.toUpperCase()}

CUSTOMER
────────
  Name:  ${order.shipping.fullName}
  Email: ${order.shipping.email}
  Phone: ${order.shipping.phone}

ITEMS ORDERED
─────────────
${itemsTableText(order)}

PRICING
───────
${totalsBlockText(order)}

SHIPPING ADDRESS
────────────────
  ${order.shipping.fullName}
  ${order.shipping.address}
  ${order.shipping.city}, ${order.shipping.state} - ${order.shipping.pincode}

PAYMENT
───────
  Method: ${paymentLabel[order.payment.method] ?? order.payment.method}
  Status: ${order.payment.status}

${order.couponCode ? `COUPON: ${order.couponCode} — saved ${fmt(order.discount)}\n` : ""}
${order.giftMessage ? `GIFT MESSAGE: "${order.giftMessage}"\n` : ""}
View in admin: ${adminUrl}
`.trim();

  return { html: layout(htmlContent), text };
}

// ─── 3. OTP verification email ────────────────────────────────────────────────
export function otpEmail({
  email,
  name,
  otp,
}: {
  email: string;
  name: string;
  otp: string;
}): { html: string; text: string } {
  // Split OTP into individual digits for the big digit display
  const digits = otp.split("").map(
    (d) =>
      `<td style="padding:0 4px;"><span style="display:inline-block;width:44px;height:56px;line-height:56px;text-align:center;background:#f4f4f5;border:2px solid #e4e4e7;border-radius:8px;font-size:28px;font-weight:800;color:#111111;font-family:Arial,sans-serif;">${d}</span></td>`
  ).join("");

  const htmlContent = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#111111;font-family:Arial,sans-serif;">Verify your email</h2>
    <p style="margin:0 0 28px;color:#555555;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
      Hi ${name}, use the code below to verify your email address and complete your LemmeWear account setup.
    </p>

    <!-- OTP digits -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
      <tr>${digits}</tr>
    </table>

    <!-- Expiry notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff8ed;border:1px solid #fed7aa;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:14px 20px;text-align:center;font-family:Arial,sans-serif;">
          <p style="margin:0;font-size:13px;color:#92400e;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;font-family:Arial,sans-serif;">
      If you did not request this, you can safely ignore this email.<br />
      This code was requested for <strong>${email}</strong>.
    </p>
  `;

  const text = `
Verify your LemmeWear account
==============================

Hi ${name},

Your verification code is:

  ${otp}

This code expires in 10 minutes. Do not share it with anyone.

If you did not request this, you can safely ignore this email.
This code was requested for ${email}.

─────────────────────────────────────────
LemmeWear | hello@lemmewear.in
`.trim();

  return { html: layout(htmlContent), text };
}
