"use client";
import Link from 'next/link';
const men = "/assets/cat-men.jpg";
const women = "/assets/cat-women.jpg";
const unisex = "/assets/cat-unisex.jpg";
const acc = "/assets/cat-accessories.jpg";
const gifts = "/assets/cat-giftpacks.png";

// Requested order: Unisex, Accessories, Gift Packs, Men, Women
const cats = [
  { href: "/shop/unisex", label: "Unisex", img: unisex },
  { href: "/accessories", label: "Accessories", img: acc },
  { href: "/gift-packs", label: "Gift Packs", img: gifts },
  { href: "/shop/men", label: "Men", img: men },
  { href: "/shop/women", label: "Women", img: women },
];

export const Categories = () => (
  <section className="container py-20">
    <div className="flex items-end justify-between mb-10">
      <div>
        <p className="text-sm font-medium text-primary mb-2">Browse</p>
        <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Shop by Category</h2>
      </div>
      <Link href="/shop/men" className="text-sm font-medium text-primary hover:underline hidden md:inline-block">View all →</Link>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
      {cats.map((c) => (
        <Link key={c.href} href={c.href} className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-card transition-smooth hover:shadow-elegant hover:-translate-y-1">
          <img src={c.img} alt={c.label} loading="lazy" width={800} height={1000} className="absolute inset-0 h-full w-full object-cover transition-smooth group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-primary-foreground">
            <h3 className="text-2xl font-bold">{c.label}</h3>
            <span className="text-sm opacity-80 group-hover:opacity-100">Explore →</span>
          </div>
        </Link>
      ))}
    </div>
  </section>
);
