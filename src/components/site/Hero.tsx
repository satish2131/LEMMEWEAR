"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from 'next/link';
const heroImg = "/assets/hero-tshirt.jpg";

export const Hero = () => (
  <section className="relative w-full h-screen min-h-[750px] flex flex-col justify-end overflow-hidden">
    {/* Full-bleed background video */}
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover object-[50%_50%]"
    >
      <source src="/assets/herovideo/9558209-uhd_4096_2160_25fps.mp4" type="video/mp4" />
      <img
        src={heroImg}
        alt="LumeWear editorial fallback"
        className="absolute inset-0 w-full h-full object-cover object-[70%_15%]"
      />
    </video>

    {/* Gradient overlay — dark at bottom, subtle at top */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
    {/* Slight left vignette for text legibility */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

    {/* Content — pushed to bottom safely with flex and pt-32 */}
    <div className="relative z-10 container px-6 sm:px-8 pb-16 lg:pb-20 pt-32 animate-fade-up">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white mb-6">
        <Sparkles className="h-3.5 w-3.5" />
        New Drop · Spring '26 Collection
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-8xl font-bold leading-[1.0] text-white mb-6 max-w-4xl">
        Design Your{" "}
        <em className="not-italic" style={{
          backgroundImage: "linear-gradient(135deg, #c4b5fd, #a78bfa, #7c3aed)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Identity.
        </em>
        <br />
        Wear Your Story.
      </h1>

      {/* Subtitle */}
      <p className="text-base lg:text-lg text-white/70 max-w-md mb-10 leading-relaxed">
        Premium t-shirts, custom designs, and unforgettable gift boxes — crafted to celebrate the one who wears them.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 mb-12">
        <Button asChild size="xl" className="bg-white text-foreground hover:bg-white/90 font-semibold shadow-lg">
          <Link href="/shop/men">Shop Now <ArrowRight className="h-5 w-5" /></Link>
        </Button>
        <Button asChild size="xl" className="bg-white/10 border border-white/30 text-white backdrop-blur-sm hover:bg-white/20 transition-smooth">
          <Link href="/customize">Customize Now</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-6 sm:gap-8 overflow-hidden">
        {[["50K+", "Happy customers"], ["1.2M+", "Designs created"], ["4.9★", "Average rating"]].map(([n, l]) => (
          <div key={l} className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-white font-sans">{n}</div>
            <div className="text-xs text-white/60 truncate">{l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
