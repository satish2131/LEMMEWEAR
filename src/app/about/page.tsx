"use client";
import { useEffect } from "react";
import Link from 'next/link';;
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Users, Award, Leaf } from "lucide-react";

const values = [
  { icon: Heart, title: "Comfort First", desc: "We obsess over fabric weight, texture, and fit so every piece feels like a second skin." },
  { icon: Sparkles, title: "Your Identity", desc: "We believe clothing should be a canvas — not a uniform. Every design tells a story." },
  { icon: Users, title: "Community", desc: "Over 50,000 customers, 12,000 designers, and one shared mission: wear who you are." },
  { icon: Leaf, title: "Sustainable", desc: "Eco-conscious packaging, responsible sourcing, and a commitment to reduce our footprint." },
];

const milestones = [
  { year: "2021", event: "LumeWear was born in a 2-bedroom studio in Mumbai" },
  { year: "2022", event: "Launched the custom design studio with 100+ templates" },
  { year: "2023", event: "Crossed ₹10 Crore in sales & shipped to 500+ cities" },
  { year: "2024", event: "Opened the community design marketplace" },
  { year: "2025", event: "Introduced 3D customization & premium gift packs" },
  { year: "2026", event: "50K+ happy customers and growing every day" },
];

const About = () => {
  useEffect(() => { document.title = "Our Story — LumeWear"; }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-50" aria-hidden />
          <div className="container relative py-20 lg:py-32 max-w-3xl">
            <p className="text-sm font-medium text-primary mb-3">Our Story</p>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              We don't make t-shirts. <br />
              We make <span className="gradient-text">canvases.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Born from the belief that what you wear should mean something. Every thread, every print, every gift box is crafted with intention — to celebrate identity, comfort, and the moments that matter.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="container py-20">
          <p className="text-sm font-medium text-primary mb-2 text-center">What We Stand For</p>
          <h2 className="text-4xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-smooth hover:shadow-card hover:-translate-y-1">
                <div className="h-12 w-12 grid place-items-center rounded-xl gradient-primary mb-4 shadow-glow">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-bold font-sans mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="container py-20 max-w-3xl">
          <p className="text-sm font-medium text-primary mb-2 text-center">The Journey</p>
          <h2 className="text-4xl font-bold text-center mb-12">Our Milestones</h2>
          <div className="relative">
            <div className="absolute left-20 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-8">
              {milestones.map((m) => (
                <div key={m.year} className="flex items-start gap-6">
                  <span className="w-14 text-right font-bold text-primary text-sm shrink-0 pt-0.5">{m.year}</span>
                  <div className="relative z-10 h-3 w-3 rounded-full gradient-primary mt-1.5 shrink-0 shadow-glow" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.event}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container py-10">
          <div className="rounded-3xl gradient-primary p-10 lg:p-16 text-primary-foreground shadow-elegant">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[["50K+","Happy Customers"],["1.2M+","Designs Created"],["500+","Cities Delivered"],["4.9★","Average Rating"]].map(([n, l]) => (
                <div key={l}>
                  <div className="text-3xl lg:text-4xl font-bold mb-1">{n}</div>
                  <div className="text-sm opacity-80">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-20 text-center">
          <Award className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to wear your identity?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Browse our premium collection or customize your own design. The perfect tee is waiting.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="hero" size="lg"><Link href="/shop/men">Shop Now</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/customize">Customize</Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
