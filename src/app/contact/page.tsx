"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, Phone, MapPin, MessageCircle, Clock, Loader2,
} from "lucide-react";

// Simple SVG social icons (lucide-react version doesn't include these)
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);
import { toast } from "sonner";
import { submitContact } from "@/lib/api";

interface SiteContact {
  email: string;
  phone: string;
  address: string;
  hours: string;
  whatsapp: string;
}
interface SiteSocial {
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
}

const DEFAULT_CONTACT: SiteContact = {
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || "hello@lemmewear.in",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || "+91 98765 43210",
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS || "Andheri West, Mumbai, Maharashtra 400058",
  hours: process.env.NEXT_PUBLIC_STORE_HOURS || "Mon–Sat 10am–7pm IST",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210",
};
const DEFAULT_SOCIAL: SiteSocial = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#",
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "#",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "#",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<SiteContact>(DEFAULT_CONTACT);
  const [social, setSocial] = useState<SiteSocial>(DEFAULT_SOCIAL);

  const setField = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    document.title = "Contact Us — LemmeWear";
    fetch("/api/site/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.contact) setContact({ ...DEFAULT_CONTACT, ...json.data.contact });
          if (json.data.social) setSocial({ ...DEFAULT_SOCIAL, ...json.data.social });
        }
      })
      .catch(() => {/* use env defaults */});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await submitContact({
        name: form.name,
        email: form.email,
        subject: form.subject || "other",
        message: form.message,
      });
      toast.success("Message sent! We'll reply within 24 hours. 💜");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const socialLinks = [
    { icon: IconInstagram, label: "Instagram", href: social.instagram, color: "text-pink-500 hover:bg-pink-500/10" },
    { icon: IconTwitter, label: "X / Twitter", href: social.twitter, color: "text-sky-500 hover:bg-sky-500/10" },
    { icon: IconFacebook, label: "Facebook", href: social.facebook, color: "text-blue-600 hover:bg-blue-600/10" },
    ...(social.youtube ? [{ icon: IconYoutube, label: "YouTube", href: social.youtube, color: "text-red-500 hover:bg-red-500/10" }] : []),
    ...(contact.whatsapp ? [{ icon: IconWhatsApp, label: "WhatsApp", href: `https://wa.me/${contact.whatsapp}`, color: "text-green-500 hover:bg-green-500/10" }] : []),
  ].filter((s) => s.href && s.href !== "#");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 gradient-hero opacity-40" aria-hidden />
          <div className="container relative py-16 lg:py-24">
            <p className="text-sm font-medium text-primary mb-3">Contact</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Have a question, custom order, or collaboration idea? We&apos;d love to hear from you.
              Our team replies within 24 hours.
            </p>
          </div>
        </section>

        <section className="container py-16 grid lg:grid-cols-[1fr_420px] gap-12">
          {/* Contact form */}
          <form onSubmit={submit} className="space-y-5">
            <h2 className="text-2xl font-bold font-sans mb-6">Send Us a Message</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={setField("name")} placeholder="Rahul Sharma" className="mt-1.5" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={setField("email")} placeholder="rahul@email.com" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <select
                value={form.subject}
                onChange={setField("subject")}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a topic</option>
                <option value="order">Order &amp; Shipping</option>
                <option value="custom">Custom Order</option>
                <option value="returns">Returns &amp; Exchanges</option>
                <option value="wholesale">Wholesale &amp; Corporate</option>
                <option value="collab">Designer Collaboration</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Message *</Label>
              <textarea
                value={form.message}
                onChange={setField("message")}
                placeholder="Tell us how we can help..."
                rows={5}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>

          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-sans mb-6">Contact Details</h2>

            {[
              { icon: Mail, title: "Email", value: contact.email, sub: "We reply within 24 hours" },
              { icon: Phone, title: "Phone", value: contact.phone, sub: "Mon–Sat, 10am–7pm IST" },
              { icon: MapPin, title: "Studio", value: contact.address, sub: "" },
              { icon: Clock, title: "Support Hours", value: contact.hours, sub: "Sunday: Limited support" },
            ].map(({ icon: Icon, title, value, sub }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-10 w-10 grid place-items-center rounded-lg gradient-primary shrink-0 shadow-glow">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-sm">{value}</p>
                  {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
              </div>
            ))}

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="p-4 rounded-xl border border-border bg-card shadow-soft">
                <p className="font-semibold text-sm mb-3">Follow Us</p>
                <div className="flex gap-3 flex-wrap">
                  {socialLinks.map(({ icon: Icon, label, href, color }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className={`h-10 w-10 grid place-items-center rounded-full border border-border transition-colors ${color}`}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs callout */}
            <div className="p-4 rounded-xl bg-accent border border-accent-foreground/10">
              <p className="font-semibold text-sm text-accent-foreground mb-1">
                Looking for quick answers?
              </p>
              <p className="text-xs text-accent-foreground/70">
                Check our FAQs for shipping, sizing, returns, and custom orders.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => toast("FAQs page coming soon!")}
              >
                View FAQs
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
