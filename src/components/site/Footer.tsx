"use client";
import { Share2, Globe, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";


export const Footer = () => (
  <footer className="border-t border-border/60 bg-secondary/30 mt-24">
    <div className="container py-16 grid gap-10 md:grid-cols-4">
      <div className="space-y-4">
        <Link href="/" className="inline-block">
          <span className="text-2xl font-black tracking-widest uppercase text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            LEMMEWEAR
          </span>
        </Link>
        <p className="text-sm text-muted-foreground max-w-xs">
          Premium t-shirts and custom gifting. Designed for those who wear their identity.
        </p>
        <div className="flex gap-3">
          {[Share2, Globe, Mail, MessageCircle].map((Icon, i) => (
            <a key={i} href="#" className="h-9 w-9 grid place-items-center rounded-full border border-border hover:gradient-primary hover:text-primary-foreground hover:border-transparent transition-smooth">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-4 font-sans">Shop</h4>
        <ul className="space-y-2.5">
          <li><Link href="/shop/men" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Men</Link></li>
          <li><Link href="/shop/women" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Women</Link></li>
          <li><Link href="/shop/unisex" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Unisex</Link></li>
          <li><Link href="/accessories" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Accessories</Link></li>
          <li><Link href="/gift-packs" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Gift Packs</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-4 font-sans">Create</h4>
        <ul className="space-y-2.5">
          <li><Link href="/customize" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Customize T-Shirt</Link></li>
          <li><Link href="/gift-packs" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Build Gift Box</Link></li>
          <li><Link href="/community" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Community Designs</Link></li>
          <li><Link href="/customize" className="text-sm text-muted-foreground hover:text-primary transition-smooth">AI Design Studio</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-4 font-sans">Help</h4>
        <ul className="space-y-2.5">
          <li><Link href="/track" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Track Order</Link></li>
          <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Contact Us</Link></li>
          <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-smooth">About Us</Link></li>
          <li><Link href="/account" className="text-sm text-muted-foreground hover:text-primary transition-smooth">My Account</Link></li>
          <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Returns & Shipping</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
        <span>© 2026 LemmeWear. Crafted with care.</span>
        <div className="flex gap-5">
          <a href="#" className="hover:text-primary transition-smooth">Privacy</a>
          <a href="#" className="hover:text-primary transition-smooth">Terms</a>
          <a href="#" className="hover:text-primary transition-smooth">Cookies</a>
        </div>
      </div>
    </div>
  </footer>
);
