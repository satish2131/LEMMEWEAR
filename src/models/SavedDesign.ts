import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedDesign extends Document {
  userEmail: string;
  userName: string;
  name: string;
  preview: string;
  config: Record<string, unknown>;
  isPublic: boolean;
  likes: number;
  likedBy: string[]; // array of user emails
  createdAt: Date;
  updatedAt: Date;
}

const SavedDesignSchema = new Schema<ISavedDesign>(
  {
    userEmail: { type: String, required: true, index: true },
    userName:  { type: String, default: "Designer" },
    name:      { type: String, required: true },
    preview:   { type: String, default: "" },
    config:    { type: Schema.Types.Mixed, default: {} },
    isPublic:  { type: Boolean, default: false, index: true },
    likes:     { type: Number, default: 0 },
    likedBy:   { type: [String], default: [] },
  },
  { timestamps: true }
);

const SavedDesign: Model<ISavedDesign> =
  mongoose.models.SavedDesign ||
  mongoose.model<ISavedDesign>("SavedDesign", SavedDesignSchema);

export default SavedDesign;
