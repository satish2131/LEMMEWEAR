"use client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Categories } from "@/components/site/Categories";
import { Trending } from "@/components/site/Trending";
import { CustomizePromo } from "@/components/site/CustomizePromo";
import { GiftPacks } from "@/components/site/GiftPacks";
import { BrandStory } from "@/components/site/BrandStory";
import { Reviews } from "@/components/site/Reviews";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "LumeWear — Premium T-Shirts & Custom Gifting";
    const desc = "Premium ready-made and customizable t-shirts, accessories, and luxury gift boxes. Design your identity with our 3D customizer.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name","description"); document.head.appendChild(meta); }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* No spacer needed — Hero uses -mt-16 to sit under the transparent fixed navbar */}
      <main className="flex-1">
        <Hero />
        <Categories />
        <Trending />
        <CustomizePromo />
        <GiftPacks />
        <BrandStory />
        <Reviews />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
