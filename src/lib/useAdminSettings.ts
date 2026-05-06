"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface GiftPack {
  name: string;
  description: string;
  price: number;
  image?: string;
}

export interface AdminSettings {
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
    packs: GiftPack[];
  };
}

export const DEFAULT_SETTINGS: AdminSettings = {
  contact: {
    email: "hello@lemmewear.in",
    phone: "+91 98765 43210",
    address: "Andheri West, Mumbai, Maharashtra 400058",
    hours: "Mon–Sat 10am–7pm IST",
    whatsapp: "919876543210",
  },
  social: {
    instagram: "",
    twitter: "",
    facebook: "",
    youtube: "",
  },
  trending: {
    sectionTitle: "Trending Now",
    sectionSubtitle: "Our most-loved pieces this season",
    productSlugs: [],
    displayCount: 4,
  },
  giftPacks: {
    sectionTitle: "Gifts they'll never forget.",
    sectionSubtitle:
      "Thoughtfully curated boxes featuring our signature tees, premium accessories, artisan chocolates, and elegant packaging.",
    packs: [
      { name: "Romantic Edit", description: "For the one who lights up your world", price: 2999 },
      { name: "Birthday Bliss", description: "Make their day unforgettable", price: 2499 },
      { name: "Corporate Premium", description: "Gift your team in style", price: 3499 },
    ],
  },
};

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSettings((prev) => ({ ...prev, ...json.data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch: Partial<AdminSettings>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (json.success) {
        setSettings((prev) => ({ ...prev, ...patch }));
        toast.success("Saved successfully");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return { settings, setSettings, loading, saving, save };
}
