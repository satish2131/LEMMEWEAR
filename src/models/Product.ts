import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  productId: string;
  slug: string;
  name: string;
  category: "men" | "women" | "unisex" | "accessories";
  subtitle: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  colors: { name: string; hex: string }[];
  sizes?: string[];
  badge?: string;
  description: string;
  features: string[];
  styles?: string[];
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["men", "women", "unisex", "accessories"],
      index: true,
    },
    subtitle: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    colors: [
      {
        name: { type: String, required: true },
        hex: { type: String, required: true },
      },
    ],
    sizes: [{ type: String }],
    badge: { type: String },
    description: { type: String, required: true },
    features: [{ type: String }],
    styles: [{ type: String }],
    inStock: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Text index for search
ProductSchema.index({ name: "text", description: "text", subtitle: "text" });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
