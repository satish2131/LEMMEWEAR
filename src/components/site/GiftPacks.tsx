"use client";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight } from "lucide-react";
import Link from 'next/link';
const giftImg = "/assets/gift-box.jpg";

const packs = [
  { name: "Romantic Edit", desc: "For the one who lights up your world", price: 2999 },
  { name: "Birthday Bliss", desc: "Make their day unforgettable", price: 2499 },
  { name: "Corporate Premium", desc: "Gift your team in style", price: 3499 },
];

export const GiftPacks = () => (
  <section className="container py-20">
    <div className="grid lg:grid-cols-5 gap-10 items-center">
      <div className="lg:col-span-2 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-xs font-medium text-primary">
          <Gift className="h-3.5 w-3.5" />
          Premium Gifting
        </div>
        <h2 className="text-4xl lg:text-5xl font-bold leading-tight">Gifts they'll <span className="gradient-text">never forget.</span></h2>
        <p className="text-muted-foreground">Thoughtfully curated boxes featuring our signature tees, premium accessories, artisan chocolates, and elegant packaging.</p>
        <Button asChild variant="hero" size="lg">
          <Link href="/gift-packs#builder">Build Your Gift Box <ArrowRight className="h-5 w-5" /></Link>
        </Button>
      </div>
      <div className="lg:col-span-3 grid sm:grid-cols-2 gap-5">
        <div className="sm:row-span-3 rounded-2xl overflow-hidden shadow-card relative group">
          <img src={giftImg} alt="Premium gift box with purple ribbon" loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-foreground/80 to-transparent text-background">
            <h3 className="text-xl font-bold">Signature Box</h3>
            <p className="text-sm opacity-90">Our most loved gift</p>
          </div>
        </div>
        {packs.map((p) => (
          <div key={p.name} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:shadow-card hover:-translate-y-1">
            <div className="h-10 w-10 grid place-items-center rounded-xl gradient-primary mb-3">
               <Gift className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold font-sans mb-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>
            <p className="text-sm font-bold gradient-text">From ₹{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
