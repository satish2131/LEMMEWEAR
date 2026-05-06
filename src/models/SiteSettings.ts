import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGiftItem {
  id: string;
  name: string;
  color?: string;   // for tshirts
  desc?: string;    // for accessories/chocolates/packaging
  price: number;
  image: string;
}

export interface ISiteSettings extends Document {
  key: string;
  contact: {
    email: string;
    phone: string;
    address: string;
    hours: string;
    whatsapp: string;
  };
  social: {
    instagram: string;
    twitter: string;
    facebook: string;
    youtube: string;
  };
  trending: {
    sectionTitle: string;
    sectionSubtitle: string;
    productSlugs: string[];
    displayCount: number;
  };
  giftPacks: {
    sectionTitle: string;
    sectionSubtitle: string;
    packs: Array<{
      name: string;
      description: string;
      price: number;
      image?: string;
    }>;
  };
  giftBuilder: {
    tshirts: IGiftItem[];
    accessories: IGiftItem[];
    chocolates: IGiftItem[];
    packagings: IGiftItem[];
  };
  updatedAt: Date;
}

const GiftItemSchema = new Schema<IGiftItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String },
    desc: { type: String },
    price: { type: Number, required: true },
    image: { type: String, required: true },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, default: "main", unique: true },
    contact: {
      email: { type: String, default: "hello@lemmewear.in" },
      phone: { type: String, default: "+91 98765 43210" },
      address: { type: String, default: "Andheri West, Mumbai, Maharashtra 400058" },
      hours: { type: String, default: "Mon–Sat 10am–7pm IST" },
      whatsapp: { type: String, default: "919876543210" },
    },
    social: {
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    trending: {
      sectionTitle: { type: String, default: "Trending Now" },
      sectionSubtitle: { type: String, default: "Our most-loved pieces this season" },
      productSlugs: [{ type: String }],
      displayCount: { type: Number, default: 4 },
    },
    giftPacks: {
      sectionTitle: { type: String, default: "Gifts they'll never forget." },
      sectionSubtitle: { type: String, default: "Thoughtfully curated boxes featuring our signature tees, premium accessories, artisan chocolates, and elegant packaging." },
      packs: [{ name: String, description: String, price: Number, image: String }],
    },
    giftBuilder: {
      tshirts: { type: [GiftItemSchema], default: [] },
      accessories: { type: [GiftItemSchema], default: [] },
      chocolates: { type: [GiftItemSchema], default: [] },
      packagings: { type: [GiftItemSchema], default: [] },
    },
  },
  { timestamps: true }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
