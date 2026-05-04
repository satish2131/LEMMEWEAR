"use client";
import { Button } from "@/components/ui/button";
import { Type, Image as ImgIcon, Palette, Move3d, ArrowRight } from "lucide-react";
import Link from 'next/link';

const features = [
  { icon: ImgIcon, title: "Upload Image", desc: "Use your own art or photo" },
  { icon: Type, title: "Add Text", desc: "Express your story in words" },
  { icon: Palette, title: "Pick Colors", desc: "Endless palette options" },
  { icon: Move3d, title: "3D Preview", desc: "Rotate and inspect live" },
];

export const CustomizePromo = () => (
  <section className="relative overflow-hidden">
    <div className="container py-20">
      <div className="relative rounded-[2rem] overflow-hidden gradient-primary p-10 lg:p-16 text-primary-foreground shadow-elegant">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-background/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium mb-3 opacity-80">Customize Studio</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5 leading-tight">
              Design a tee that's <em className="not-italic">truly yours.</em>
            </h2>
            <p className="opacity-85 mb-8 max-w-md">
              Drag, type, and tweak in real-time on a fully rotatable 3D model. From idea to wearable in minutes.
            </p>
            <Button asChild size="xl" className="bg-background text-primary hover:bg-background/90 shadow-lg">
              <Link href="/customize">Start Designing <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-background/10 backdrop-blur border border-background/20 p-5 transition-smooth hover:bg-background/20">
                <div className="h-10 w-10 grid place-items-center rounded-xl bg-background/20 mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold font-sans mb-1">{title}</h3>
                <p className="text-sm opacity-75">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
