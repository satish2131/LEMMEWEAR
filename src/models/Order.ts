import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  packagingType: string;
  packagingCost: number;
  shippingCost: number;
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
    status: "pending" | "paid" | "failed" | "refunded";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  status: "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingId?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, default: "custom-item" },
    image: { type: String, default: "/assets/hero-tshirt.jpg" },
    color: { type: String, default: "Custom" },
    size: { type: String, default: "M" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    packagingType: { type: String, default: "standard" },
    packagingCost: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
    giftMessage: { type: String },
    shipping: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        required: true,
        enum: ["upi", "card", "netbanking", "cod"],
      },
      status: {
        type: String,
        default: "pending",
        enum: ["pending", "paid", "failed", "refunded"],
      },
      razorpayOrderId:   { type: String },
      razorpayPaymentId: { type: String },
    },
    status: {
      type: String,
      default: "confirmed",
      enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"],
      index: true,
    },
    trackingId: { type: String },
    estimatedDelivery: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
