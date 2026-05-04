import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedDesign extends Document {
  userEmail: string;
  name: string;
  preview: string; // base64 or URL of the design preview
  config: {
    shirtColor: string;
    shirtStyle: string;
    frontText?: string;
    backText?: string;
    frontImage?: string;
    backImage?: string;
    fontFamily?: string;
    fontSize?: number;
    textColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SavedDesignSchema = new Schema<ISavedDesign>(
  {
    userEmail: { type: String, required: true, index: true },
    name: { type: String, required: true },
    preview: { type: String, default: "" },
    config: {
      shirtColor: { type: String, default: "#ffffff" },
      shirtStyle: { type: String, default: "crew-neck" },
      frontText: { type: String },
      backText: { type: String },
      frontImage: { type: String },
      backImage: { type: String },
      fontFamily: { type: String },
      fontSize: { type: Number },
      textColor: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const SavedDesign: Model<ISavedDesign> =
  mongoose.models.SavedDesign ||
  mongoose.model<ISavedDesign>("SavedDesign", SavedDesignSchema);

export default SavedDesign;
