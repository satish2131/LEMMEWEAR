/**
 * Stores the cart/shipping payload temporarily while Razorpay processes payment.
 * Keyed by razorpay_order_id. Deleted after order is created or after 24h (TTL).
 */
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPendingPayment extends Document {
  razorpayOrderId: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

const PendingPaymentSchema = new Schema<IPendingPayment>(
  {
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    payload:         { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Auto-delete after 24 hours
PendingPaymentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const PendingPayment: Model<IPendingPayment> =
  mongoose.models.PendingPayment ||
  mongoose.model<IPendingPayment>("PendingPayment", PendingPaymentSchema);

export default PendingPayment;
