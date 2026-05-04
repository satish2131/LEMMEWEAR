"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Image as ImageIcon, MessageCircle, Users, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitContact } from "@/lib/api";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => { document.title = "Contact Us — LemmeWear"; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("Please fill all required fields"); return; }

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
      const message = err instanceof Error ? err.message : "Failed to send message";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 gradient-hero opacity-40" aria-hidden />
          <div className="container relative py-16 lg:py-24">
            <p className="text-sm font-medium text-primary mb-3">Contact</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">Get in <span className="gradient-text">Touch</span></h1>
            <p className="text-muted-foreground max-w-xl">Have a question, custom order, or collaboration idea? We'd love to hear from you. Our team replies within 24 hours.</p>
          </div>
        </section>

        <section className="container py-16 grid lg:grid-cols-[1fr_420px] gap-12">
          {/* Contact form */}
          <form onSubmit={submit} className="space-y-5">
            <h2 className="text-2xl font-bold font-sans mb-6">Send Us a Message</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full Name *</Label><Input value={form.name} onChange={set("name")} placeholder="Rahul Sharma" className="mt-1.5" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} placeholder="rahul@email.com" className="mt-1.5" /></div>
            </div>
            <div>
              <Label>Subject</Label>
              <select value={form.subject} onChange={set("subject")}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select a topic</option>
                <option value="order">Order & Shipping</option>
                <option value="custom">Custom Order</option>
                <option value="returns">Returns & Exchanges</option>
                <option value="wholesale">Wholesale & Corporate</option>
                <option value="collab">Designer Collaboration</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Message *</Label>
              <textarea
                value={form.message}
                onChange={set("message")}
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
              { icon: Mail, title: "Email", value: "hello@lemmewear.in", sub: "We reply within 24 hours" },
              { icon: Phone, title: "Phone", value: "+91 98765 43210", sub: "Mon–Sat, 10am–7pm IST" },
              { icon: MapPin, title: "Studio", value: "Andheri West, Mumbai", sub: "Maharashtra, India 400058" },
              { icon: Clock, title: "Support Hours", value: "Mon–Sat 10am–7pm", sub: "Sunday: Limited support" },
            ].map(({ icon: Icon, title, value, sub }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-10 w-10 grid place-items-center rounded-lg gradient-primary shrink-0 shadow-glow">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-sm">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}

            {/* Social */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-soft">
              <p className="font-semibold text-sm mb-3">Follow Us</p>
              <div className="flex gap-3">
                {[{ Icon: ImageIcon, label: "Instagram", href: "#" }, { Icon: MessageCircle, label: "X", href: "#" }, { Icon: Users, label: "Facebook", href: "#" }].map(({ Icon, label, href }) => (
                  <a key={label} href={href} aria-label={label}
                    className="h-10 w-10 grid place-items-center rounded-full border border-border hover:gradient-primary hover:text-primary-foreground hover:border-transparent transition-smooth">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* FAQs callout */}
            <div className="p-4 rounded-xl bg-accent border border-accent-foreground/10">
              <p className="font-semibold text-sm text-accent-foreground mb-1">Looking for quick answers?</p>
              <p className="text-xs text-accent-foreground/70">Check our FAQs for shipping, sizing, returns, and custom orders.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => toast("FAQs page coming soon!")}>View FAQs</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
