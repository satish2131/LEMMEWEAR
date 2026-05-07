import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  productSlug: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  images: string[]; // base64 or URLs
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productSlug: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
