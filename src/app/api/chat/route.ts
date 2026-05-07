import dbConnect from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import Order from "@/models/Order";

// ─── Order number detection ───────────────────────────────────────────────────
// Matches formats like: LW-MOV8JFMA-3374, LW-ABC123-1234
const ORDER_NUMBER_REGEX = /\bLW-[A-Z0-9]+-[0-9]+\b/i;

async function lookupOrder(orderNumber: string, userEmail?: string) {
  try {
    await dbConnect();
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
    }).lean();
    return order || null;
  } catch {
    return null;
  }
}

function formatOrderStatus(order: any): string {
  const statusEmoji: Record<string, string> = {
    confirmed:  "✅",
    processing: "⚙️",
    shipped:    "🚚",
    delivered:  "📦",
    cancelled:  "❌",
  };

  const statusDesc: Record<string, string> = {
    confirmed:  "Your order has been confirmed and is being prepared.",
    processing: "Your order is being printed and packed.",
    shipped:    "Your order is on the way!",
    delivered:  "Your order has been delivered.",
    cancelled:  "This order has been cancelled.",
  };

  const emoji = statusEmoji[order.status] || "📋";
  const desc  = statusDesc[order.status]  || "Status unknown.";

  const estDelivery = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const itemList = order.items
    .slice(0, 3)
    .map((i: any) => `• ${i.name} (${i.color}, ${i.size}) × ${i.quantity}`)
    .join("\n");

  const moreItems = order.items.length > 3
    ? `\n• ...and ${order.items.length - 3} more item(s)`
    : "";

  return [
    `${emoji} **Order ${order.orderNumber}**`,
    `Status: **${order.status.charAt(0).toUpperCase() + order.status.slice(1)}**`,
    desc,
    "",
    `**Items:**`,
    itemList + moreItems,
    "",
    `**Total:** ₹${order.total.toLocaleString("en-IN")}`,
    `**Payment:** ${order.payment.method.toUpperCase()} · ${order.payment.status}`,
    estDelivery ? `**Est. Delivery:** ${estDelivery}` : "",
    order.trackingId ? `**Tracking ID:** ${order.trackingId}` : "",
  ].filter(Boolean).join("\n");
}

// ─── Bot knowledge base ───────────────────────────────────────────────────────
const BOT_RULES: {
  patterns: RegExp[];
  response: string;
}[] = [
  {
    patterns: [/track/i, /where.*order/i, /order.*status/i, /delivery.*status/i],
    response: `To track your order:\n1. Go to **My Account → Orders**\n2. Or visit the **Track** page in the top nav\n3. Enter your order number (format: LW-XXXXX)\n\nYou'll see real-time status: Confirmed → Processing → Shipped → Delivered. Need help with a specific order? Share your order number and I'll look into it.`,
  },
  {
    patterns: [/shipping/i, /deliver/i, /how long/i, /days/i, /arrive/i],
    response: `**Shipping details:**\n• Standard delivery: 5–7 business days\n• We ship across India via trusted courier partners\n• Free shipping on all orders above ₹999\n• You'll receive a tracking link via email once shipped\n\nOrders are processed within 1–2 business days after payment confirmation.`,
  },
  {
    patterns: [/return/i, /refund/i, /exchange/i, /replace/i],
    response: `**Returns & Refunds:**\n• 7-day return window from delivery date\n• Items must be unworn, unwashed, with original tags\n• Custom/personalized designs are non-returnable\n• Refunds are processed within 5–7 business days\n\nTo initiate a return, email us at hello@lemmewear.in with your order number and reason.`,
  },
  {
    patterns: [/size/i, /fit/i, /measurement/i, /chart/i, /xs|small|medium|large|xl|xxl/i],
    response: `**Size Guide:**\n• XS: Chest 36–38 in\n• S: Chest 38–40 in\n• M: Chest 40–42 in\n• L: Chest 42–44 in\n• XL: Chest 44–46 in\n• XXL: Chest 46–48 in\n\nFor oversized fits, we recommend sizing down. Check the full size chart on any product page. Still unsure? Tell me your height/weight and I'll suggest a size!`,
  },
  {
    patterns: [/custom/i, /design/i, /personali/i, /print/i, /logo/i],
    response: `**Custom Design:**\n• Visit the **Customize** page to design your own tee\n• Upload your artwork or add text in 50+ fonts\n• 3D live preview — drag to reposition your design\n• Custom tees start at ₹1,899\n• Bulk orders (10+) get special pricing — contact us!\n\nCustom designs take 3–5 extra business days for printing.`,
  },
  {
    patterns: [/pay/i, /payment/i, /upi/i, /card/i, /cod/i, /cash/i, /net.?banking/i],
    response: `**Payment Options:**\n• UPI (GPay, PhonePe, Paytm, BHIM)\n• Credit / Debit Card (Visa, Mastercard, Rupay)\n• Net Banking (all major banks)\n• Cash on Delivery (COD)\n\nAll online payments are SSL encrypted. We never store card details.`,
  },
  {
    patterns: [/cancel/i, /cancell/i],
    response: `**Order Cancellation:**\n• Orders can be cancelled within **2 hours** of placing\n• After 2 hours, the order enters processing and cannot be cancelled\n• Custom/personalized orders cannot be cancelled once confirmed\n\nTo cancel, go to **My Account → Orders** or email hello@lemmewear.in immediately.`,
  },
  {
    patterns: [/gift/i, /gift.?pack/i, /gift.?box/i],
    response: `**Gift Packs:**\n• Build a custom gift box with a t-shirt + accessories + chocolates\n• Choose from premium, luxury, or standard packaging\n• Add a personal message card\n• Visit the **Gift Packs** page to start building!\n\nGift packs make perfect birthday, anniversary, or festive presents. 🎁`,
  },
  {
    patterns: [/coupon/i, /discount/i, /promo/i, /offer/i, /code/i],
    response: `**Discounts & Coupons:**\n• Apply coupon codes at checkout in the cart page\n• Follow us on Instagram @lemmewear for exclusive codes\n• New users get **100 reward points** on signup\n• Reward points can be redeemed on future orders\n\nHave a specific code that's not working? Share it and I'll check!`,
  },
  {
    patterns: [/account/i, /login/i, /sign.?in/i, /sign.?up/i, /register/i, /password/i],
    response: `**Account Help:**\n• Create an account at **/login** → "Create Account"\n• Email OTP verification is required for new accounts\n• Forgot password? Use the reset option on the login page\n• Your account stores orders, wishlist, saved designs & addresses\n\nNeed help with a specific account issue? Let me know!`,
  },
  {
    patterns: [/contact/i, /email/i, /phone/i, /address/i, /reach/i, /call/i],
    response: `**Contact LemmeWear:**\n• 📧 Email: hello@lemmewear.in\n• 📞 Phone: +91 98765 43210\n• 📍 Address: Andheri West, Mumbai, Maharashtra 400058\n• 🕐 Hours: Mon–Sat, 10am–7pm IST\n\nOr type **"talk to agent"** and I'll create a support ticket for you!`,
  },
  {
    patterns: [/quality/i, /material/i, /fabric/i, /cotton/i, /wash/i, /care/i],
    response: `**Product Quality:**\n• 100% premium ring-spun cotton (180–220 GSM)\n• Pre-shrunk fabric — minimal shrinkage after wash\n• Eco-friendly water-based inks for prints\n• Machine wash cold, inside out, gentle cycle\n• Do not tumble dry — air dry for best results\n• Prints last 50+ washes with proper care`,
  },
  {
    patterns: [/reward/i, /point/i, /loyalty/i, /earn/i],
    response: `**Reward Points:**\n• Earn 100 points on signup\n• Earn points on every purchase\n• Leave a review → earn 50 bonus points\n• Points can be redeemed for discounts on future orders\n\nCheck your points balance in **My Account**.`,
  },
  {
    patterns: [/hello|hi|hey|hii|helo|namaste/i],
    response: `Hey there! 👋 Welcome to **LemmeWear** support!\n\nI can help you with:\n• 📦 Order tracking & status\n• 🚚 Shipping & delivery\n• 🔄 Returns & refunds\n• 📏 Sizing & fit guide\n• 🎨 Custom design help\n• 💳 Payment options\n\nWhat can I help you with today?`,
  },
  {
    patterns: [/thank/i, /thanks/i, /great/i, /awesome/i, /perfect/i, /helpful/i],
    response: `You're welcome! 😊 Happy to help.\n\nIs there anything else I can assist you with? If you need to speak with our team directly, just type **"talk to agent"** and I'll connect you.`,
  },
  {
    patterns: [/bye|goodbye|see you|done|that.?s all/i],
    response: `Thanks for reaching out to LemmeWear! 👕\n\nHave a great day and happy shopping! If you need help again, I'm always here. 😊`,
  },
];

const ESCALATION_PATTERNS = [
  /human/i, /agent/i, /talk.*person/i, /speak.*person/i, /real.*person/i,
  /support.*ticket/i, /raise.*ticket/i, /complaint/i, /escalate/i,
  /not.*help/i, /useless/i, /manager/i,
];

function getBotResponse(message: string): string | null {
  for (const rule of BOT_RULES) {
    if (rule.patterns.some((p) => p.test(message))) {
      return rule.response;
    }
  }
  return null;
}

function needsEscalation(message: string): boolean {
  return ESCALATION_PATTERNS.some((p) => p.test(message));
}

// ─── API Route ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { message, userName, userEmail, conversationHistory } = await request.json();

    if (!message?.trim()) {
      return Response.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const trimmed = message.trim();

    // ── 1. Order number lookup — highest priority ──────────────────────────
    const orderMatch = trimmed.match(ORDER_NUMBER_REGEX);
    if (orderMatch) {
      const orderNumber = orderMatch[0].toUpperCase();
      const order = await lookupOrder(orderNumber, userEmail);

      if (order) {
        return Response.json({
          success: true,
          response: formatOrderStatus(order),
        });
      } else {
        return Response.json({
          success: true,
          response: `I couldn't find order **${orderNumber}** in our system.\n\nPlease check:\n• The order number is correct (format: LW-XXXXX-XXXX)\n• You're using the number from your confirmation email\n\nIf you're sure it's correct, type **"talk to agent"** and our team will look into it.`,
        });
      }
    }

    // ── 2. Check if user is asking about their orders (logged in) ──────────
    if (
      userEmail &&
      /my order|my orders|all order|recent order|order history|order list/i.test(trimmed)
    ) {
      try {
        await dbConnect();
        const orders = await Order.find({ "shipping.email": userEmail })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        if (orders.length > 0) {
          const list = orders
            .map((o: any) => {
              const emoji: Record<string, string> = {
                confirmed: "✅", processing: "⚙️", shipped: "🚚",
                delivered: "📦", cancelled: "❌",
              };
              return `${emoji[o.status] || "📋"} **${o.orderNumber}** — ${o.status} · ₹${o.total.toLocaleString("en-IN")}`;
            })
            .join("\n");

          return Response.json({
            success: true,
            response: `Here are your recent orders:\n\n${list}\n\nShare an order number for detailed tracking info!`,
          });
        } else {
          return Response.json({
            success: true,
            response: `I don't see any orders linked to your account yet.\n\nIf you placed an order as a guest, share the order number (format: LW-XXXXX-XXXX) and I'll look it up!`,
          });
        }
      } catch {
        // fall through to rule engine
      }
    }

    // ── 3. Human escalation ────────────────────────────────────────────────
    if (needsEscalation(trimmed)) {
      if (userEmail) {
        try {
          await dbConnect();
          const ticketNumber = `TK-${Date.now().toString(36).toUpperCase()}`;
          const history = (conversationHistory || [])
            .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Bot"}: ${m.content}`)
            .join("\n");

          await SupportTicket.create({
            ticketNumber,
            customer: userName || "Customer",
            email: userEmail,
            subject: "Chat Support Request",
            description: `Customer requested human support via chatbot.\n\nConversation:\n${history}\n\nLast message: ${trimmed}`,
            priority: "High",
            status: "Open",
          });

          return Response.json({
            success: true,
            response: `I've created a support ticket **${ticketNumber}** for you! 🎫\n\nOur team will reach out to **${userEmail}** within 2–4 business hours (Mon–Sat, 10am–7pm IST).\n\nYou can also email us directly at hello@lemmewear.in or call +91 98765 43210.`,
            ticketCreated: true,
            ticketNumber,
          });
        } catch {
          // fall through
        }
      }

      return Response.json({
        success: true,
        response: `I'll connect you with our support team! 🙋\n\nPlease email us at **hello@lemmewear.in** or call **+91 98765 43210** (Mon–Sat, 10am–7pm IST).\n\nAlternatively, sign in to your account and I can automatically create a support ticket for you.`,
      });
    }

    // ── 4. Rule-based knowledge base ──────────────────────────────────────
    const botResponse = getBotResponse(trimmed);
    if (botResponse) {
      return Response.json({ success: true, response: botResponse });
    }

    // ── 5. Fallback ────────────────────────────────────────────────────────
    return Response.json({
      success: true,
      response: `I'm not sure about that, but I'm here to help! 🤔\n\nYou can ask me about:\n• Order tracking (share your order number like LW-XXXXX-XXXX)\n• Shipping & delivery\n• Returns & refunds\n• Sizing guide\n• Custom designs\n• Payment options\n\nOr type **"talk to agent"** to connect with our support team.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
