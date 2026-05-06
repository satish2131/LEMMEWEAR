"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles, ShoppingBag, RotateCw, Gift,
  Image as ImageIcon, Type, Palette, Move3d, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { BookmarkPlus } from "lucide-react";
import { buildDesignTextures } from "@/lib/buildDesignTextures";
import CanvaColorPicker from "@/components/ui/CanvaColorPicker";

/* Dynamic import — disables SSR for the heavy Three.js Canvas */
const Viewer = dynamic(() => import("@/components/Customizer/Viewer"), { ssr: false });
import { ShirtType } from "@/lib/constants/modelConfig";

/* ─── Constants ─── */
const PALETTE = [
  { name: "White", hex: "#f5f5f5" },
  { name: "Royal", hex: "#7c3aed" },
  { name: "Plum", hex: "#5b21b6" },
  { name: "Onyx", hex: "#1a1a1a" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Sage", hex: "#4ade80" },
  { name: "Sky", hex: "#38bdf8" },
];

const FONTS = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Helvetica", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { name: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { name: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { name: "Segoe UI", value: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { name: "Calibri", value: "Calibri, sans-serif" },
  { name: "Candara", value: "Candara, sans-serif" },
  { name: "Impact", value: "Impact, Charcoal, sans-serif" },
  { name: "Arial Black", value: "'Arial Black', Gadget, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Garamond", value: "Garamond, serif" },
  { name: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { name: "Bookman", value: "'Bookman Old Style', serif" },
  { name: "Baskerville", value: "Baskerville, 'Baskerville Old Face', serif" },
  { name: "Courier New", value: "'Courier New', Courier, monospace" },
  { name: "Lucida Console", value: "'Lucida Console', Monaco, monospace" },
  { name: "Consolas", value: "Consolas, monospace" },
  { name: "Monaco", value: "Monaco, monospace" },
  { name: "Brush Script", value: "'Brush Script MT', cursive" },
  { name: "Comic Sans", value: "'Comic Sans MS', cursive, sans-serif" },
  { name: "Papyrus", value: "Papyrus, fantasy" },
  { name: "Luminari", value: "Luminari, fantasy" },
  { name: "Chalkduster", value: "Chalkduster, fantasy" },
  { name: "Blippo", value: "Blippo, fantasy" },
  { name: "Stencil", value: "Stencil, fantasy" },
  { name: "Copperplate", value: "Copperplate, fantasy" },
  { name: "Didot", value: "Didot, serif" },
  { name: "Century Gothic", value: "'Century Gothic', sans-serif" },
  { name: "Franklin Gothic", value: "'Franklin Gothic Medium', sans-serif" },
  { name: "Futura", value: "Futura, sans-serif" },
  { name: "Gill Sans", value: "'Gill Sans', sans-serif" },
  { name: "Rockwell", value: "Rockwell, serif" },
  { name: "Cambria", value: "Cambria, serif" },
  { name: "Constantia", value: "Constantia, serif" },
  { name: "Corbel", value: "Corbel, sans-serif" },
  { name: "Hoefler Text", value: "'Hoefler Text', serif" },
  { name: "Avant Garde", value: "'Avant Garde', sans-serif" },
  { name: "Optima", value: "Optima, sans-serif" },
  { name: "Playfair", value: "'Playfair Display', Georgia, serif" },
  { name: "Inter", value: "Inter, Arial, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Lato", value: "Lato, sans-serif" },
  { name: "Montserrat", value: "Montserrat, sans-serif" },
  { name: "Oswald", value: "Oswald, sans-serif" },
  { name: "Raleway", value: "Raleway, sans-serif" },
  { name: "Nunito", value: "Nunito, sans-serif" },
  { name: "Ubuntu", value: "Ubuntu, sans-serif" }
];

/* ─── Page ─── */
export default function Customize() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [text, setText] = useState("YOUR\nIDENTITY");
  const [font, setFont] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState("#ffffff");
  const [shirtType, setShirtType] = useState<ShirtType>("regular");
  const [shirtColor, setShirtColor] = useState(PALETTE[1].hex);
  const [selectedSize, setSelectedSize] = useState("M");
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const [textPosY, setTextPosY] = useState(0);
  const [imgScale, setImgScale] = useState(1);
  const [imgPosY, setImgPosY] = useState(0);
  const [designTexFront, setDesignTexFront] = useState<THREE.CanvasTexture | null>(null);
  const [designTexBack, setDesignTexBack] = useState<THREE.CanvasTexture | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedImg, setUploadedImg] = useState<HTMLImageElement | null>(null);
  const [imgShowFront, setImgShowFront] = useState(true);
  const [imgShowBack, setImgShowBack] = useState(true);
  const [textShowFront, setTextShowFront] = useState(true);
  const [textShowBack, setTextShowBack] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const { front, back } = buildDesignTextures({
      text, font, textColor, textScale, textPosY,
      imgScale, imgPosY, uploadedImg,
      imgShowFront, imgShowBack, textShowFront, textShowBack,
    });
    setDesignTexFront(old => { old?.dispose(); return front; });
    setDesignTexBack(old => { old?.dispose(); return back; });
  }, [text, font, textColor, textScale, textPosY, imgScale, imgPosY, uploadedImg, imgShowFront, imgShowBack, textShowFront, textShowBack]);

  const handleSaveDesign = async () => {
    if (!user?.email) {
      toast.error("Please login to save your design");
      router.push("/login");
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch("/api/users/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          name: text.trim() || "My Custom Design",
          preview: preview || "/assets/hero-tshirt.jpg",
          config: { text, font, textColor, shirtColor, textScale, textPosY, imgScale, imgPosY, imgShowFront, imgShowBack, textShowFront, textShowBack }
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Design saved to your dashboard!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save design");
    } finally {
      setIsSaving(false);
    }
  };

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setPreview(src);
      const img = new window.Image();
      img.onload = () => setUploadedImg(img);
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) loadImage(f);
  };
  const removeImage = () => {
    setUploadedImg(null); setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />
      <main className="flex-1">
        <div className="container py-10">

          {/* Hero Banner */}
          <div className="relative rounded-[1.5rem] overflow-hidden gradient-primary p-6 lg:p-10 text-primary-foreground shadow-elegant mb-8">
            <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-primary-glow/40 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-background/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-xs font-medium mb-2 opacity-80 uppercase tracking-widest">Design Studio</p>
                <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  Customize your tee
                </h1>
                <p className="opacity-85 max-w-sm text-sm">
                  Real 3D UV-mapped shirt model. Drag to rotate. Upload your art or add text.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: ImageIcon, title: "Upload Image", desc: "Use your own art or photo" },
                  { icon: Type, title: "Add Text", desc: "Express your story in words" },
                  { icon: Palette, title: "Pick Colors", desc: "Endless palette options" },
                  { icon: Move3d, title: "3D Preview", desc: "Drag to rotate live" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl bg-background/10 backdrop-blur border border-background/20 p-4 hover:bg-background/20 transition-smooth">
                    <div className="h-8 w-8 grid place-items-center rounded-lg bg-background/20 mb-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{title}</h3>
                    <p className="text-xs opacity-75">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6">

            {/* 3D Viewport — sticky so it stays in view while scrolling controls */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-card h-[420px] lg:h-[600px]"
                style={{
                  background: "radial-gradient(ellipse at 55% 35%, #e8e1fa 0%, #f0ecfc 45%, #e4dff5 100%)",
                }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(70% 60% at 50% 40%, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />

                <Viewer
                  shirtType={shirtType}
                  color={shirtColor}
                  designTexFront={designTexFront}
                  designTexBack={designTexBack}
                  showFront={imgShowFront || textShowFront}
                  showBack={imgShowBack || textShowBack}
                  autoRotate={autoRotate}
                  onInteract={() => setAutoRotate(false)}
                  onResetRef={resetCameraRef}
                />

                <button onClick={() => { resetCameraRef.current?.(); setAutoRotate(true); }}
                  className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-white/80 backdrop-blur shadow-soft hover:bg-white transition-smooth z-10"
                  aria-label="Reset view">
                  <RotateCw className="h-4 w-4 text-primary" />
                </button>
                <div className="absolute bottom-4 left-4 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-soft text-foreground/70 z-10">
                  Drag to rotate · Scroll to zoom
                </div>
              </div>
            </div>

            {/* Controls */}
            <aside className="rounded-3xl border border-border bg-card shadow-soft p-6 space-y-6 h-fit">

              {/* Upload */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Upload Design</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" id="design-upload" onChange={handleUpload} />
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Design" className="w-full h-28 object-contain rounded-xl border border-border bg-secondary/20" />
                    <button onClick={removeImage}
                      className="absolute top-1.5 right-1.5 h-6 w-6 grid place-items-center rounded-full bg-background/90 border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                      aria-label="Remove">
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-green-600 mt-1.5 text-center font-medium">✓ Applied to shirt</p>
                  </div>
                ) : (
                  <label htmlFor="design-upload"
                    className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-accent/30 cursor-pointer transition-smooth">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload image</span>
                  </label>
                )}

                {/* Image Placement Checkboxes */}
                <div className="flex items-center gap-6 mt-4 pl-1 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={imgShowFront} onChange={(e) => setImgShowFront(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary transition-smooth" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-smooth">Front Side</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={imgShowBack} onChange={(e) => setImgShowBack(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary transition-smooth" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-smooth">Back Side</span>
                  </label>
                </div>

                {preview && (
                  <div className="mt-4 p-3 rounded-xl border border-border bg-accent/30 space-y-4">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Image Size</Label>
                        <span className="text-[10px] text-muted-foreground">{imgScale.toFixed(2)}x</span>
                      </div>
                      <Slider value={[imgScale]} onValueChange={(v) => setImgScale(v[0])} min={0.3} max={2} step={0.05} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Image Position Y</Label>
                        <span className="text-[10px] text-muted-foreground">{imgPosY.toFixed(2)}</span>
                      </div>
                      <Slider value={[imgPosY]} onValueChange={(v) => setImgPosY(v[0])} min={-1} max={1} step={0.05} />
                    </div>
                  </div>
                )}
              </div>

              {/* Shirt Type */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apparel Type</Label>
                <div className="flex gap-2 mt-3">
                  {(["regular", "oversized", "hoodie", "polo"] as ShirtType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setShirtType(type)}
                      className={`flex-1 capitalize h-10 rounded-xl border-2 text-xs font-semibold transition-smooth ${
                        shirtType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Size Selector */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</Label>
                    <button
                      onClick={() => setSizeChartOpen(true)}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Size Chart →
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-9 min-w-[2.5rem] px-3 rounded-lg border-2 text-xs font-bold transition-smooth ${
                          selectedSize === size
                            ? "border-primary bg-primary text-primary-foreground shadow-glow"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Selected: <span className="font-semibold text-foreground">{selectedSize}</span>
                    {shirtType === "oversized" && " · Oversized fit — size down if unsure"}
                    {shirtType === "hoodie" && " · True to size"}
                  </p>
                </div>
              </div>

              {/* Size Chart Modal */}
              {sizeChartOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={() => setSizeChartOpen(false)}>
                  <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-5 border-b border-border">
                      <div>
                        <h3 className="font-bold text-base">Size Chart</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{shirtType} fit</p>
                      </div>
                      <button onClick={() => setSizeChartOpen(false)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-5 space-y-5">
                      {/* Measurement guide */}
                      <div className="rounded-xl bg-accent/40 p-4 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-semibold text-foreground text-sm mb-2">How to measure</p>
                        <p>📏 <strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</p>
                        <p>📏 <strong>Length:</strong> Measure from the highest point of the shoulder to the hem.</p>
                        <p>📏 <strong>Shoulder:</strong> Measure from shoulder seam to shoulder seam across the back.</p>
                      </div>

                      {/* Size table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground rounded-tl-lg">Size</th>
                              <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">Chest (in)</th>
                              <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">Length (in)</th>
                              <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground rounded-tr-lg">Shoulder (in)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(shirtType === "oversized"
                              ? [
                                  { size: "XS", chest: "40", length: "27", shoulder: "18" },
                                  { size: "S",  chest: "42", length: "28", shoulder: "19" },
                                  { size: "M",  chest: "44", length: "29", shoulder: "20" },
                                  { size: "L",  chest: "46", length: "30", shoulder: "21" },
                                  { size: "XL", chest: "48", length: "31", shoulder: "22" },
                                  { size: "XXL",chest: "50", length: "32", shoulder: "23" },
                                  { size: "3XL",chest: "52", length: "33", shoulder: "24" },
                                ]
                              : shirtType === "hoodie"
                              ? [
                                  { size: "XS", chest: "38", length: "26", shoulder: "17" },
                                  { size: "S",  chest: "40", length: "27", shoulder: "18" },
                                  { size: "M",  chest: "42", length: "28", shoulder: "19" },
                                  { size: "L",  chest: "44", length: "29", shoulder: "20" },
                                  { size: "XL", chest: "46", length: "30", shoulder: "21" },
                                  { size: "XXL",chest: "48", length: "31", shoulder: "22" },
                                  { size: "3XL",chest: "50", length: "32", shoulder: "23" },
                                ]
                              : [
                                  { size: "XS", chest: "36", length: "26", shoulder: "16" },
                                  { size: "S",  chest: "38", length: "27", shoulder: "17" },
                                  { size: "M",  chest: "40", length: "28", shoulder: "18" },
                                  { size: "L",  chest: "42", length: "29", shoulder: "19" },
                                  { size: "XL", chest: "44", length: "30", shoulder: "20" },
                                  { size: "XXL",chest: "46", length: "31", shoulder: "21" },
                                  { size: "3XL",chest: "48", length: "32", shoulder: "22" },
                                ]
                            ).map((row) => (
                              <tr key={row.size}
                                className={`border-b border-border/50 transition-colors ${
                                  selectedSize === row.size ? "bg-primary/10" : "hover:bg-muted/30"
                                }`}>
                                <td className="px-3 py-2.5">
                                  <span className={`font-bold text-sm ${selectedSize === row.size ? "text-primary" : ""}`}>
                                    {row.size}
                                    {selectedSize === row.size && " ✓"}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center text-muted-foreground">{row.chest}</td>
                                <td className="px-3 py-2.5 text-center text-muted-foreground">{row.length}</td>
                                <td className="px-3 py-2.5 text-center text-muted-foreground">{row.shoulder}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        All measurements are in inches. For a relaxed fit, size up. For a fitted look, choose your exact size.
                      </p>

                      {/* Quick select from chart */}
                      <div>
                        <p className="text-xs font-semibold mb-2">Quick select:</p>
                        <div className="flex gap-2 flex-wrap">
                          {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => (
                            <button key={size}
                              onClick={() => { setSelectedSize(size); setSizeChartOpen(false); }}
                              className={`h-9 min-w-[2.5rem] px-3 rounded-lg border-2 text-xs font-bold transition-smooth ${
                                selectedSize === size
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50"
                              }`}>
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shirt Color */}
              <div>
                <CanvaColorPicker
                  label="Shirt Color"
                  value={shirtColor}
                  onChange={setShirtColor}
                  swatches={PALETTE}
                />
              </div>

              {/* Text */}
              <div>
                <Label htmlFor="design-text" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Text</Label>
                <textarea id="design-text" value={text} onChange={(e) => setText(e.target.value)} rows={2}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Type your message..." />
                {/* Text Placement Checkboxes */}
                <div className="flex items-center gap-6 mt-3 pl-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={textShowFront} onChange={(e) => setTextShowFront(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary transition-smooth" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-smooth">Front Side</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={textShowBack} onChange={(e) => setTextShowBack(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary transition-smooth" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-smooth">Back Side</span>
                  </label>
                </div>
              </div>

              {/* Font */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Font</Label>
                <div className="grid grid-cols-2 gap-2 mt-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {FONTS.map((f) => (
                    <button key={f.name} onClick={() => setFont(f.value)} style={{ fontFamily: f.value }}
                      className={`h-10 truncate px-2 rounded-lg border text-sm font-semibold transition-smooth ${font === f.value ? "border-primary bg-accent text-primary" : "border-border hover:bg-secondary"}`}
                      title={f.name}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div>
                <CanvaColorPicker
                  label="Text Color"
                  value={textColor}
                  onChange={setTextColor}
                  swatches={[
                    { name: "White", hex: "#ffffff" },
                    { name: "Black", hex: "#000000" },
                    { name: "Royal", hex: "#7c3aed" },
                    { name: "Rose", hex: "#f43f5e" },
                    { name: "Sky", hex: "#38bdf8" },
                    { name: "Sage", hex: "#4ade80" },
                    { name: "Gold", hex: "#f59e0b" },
                    { name: "Coral", hex: "#fb923c" },
                  ]}
                />

                <div className="mt-4 p-3 rounded-xl border border-border bg-accent/30 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Text Size</Label>
                      <span className="text-[10px] text-muted-foreground">{textScale.toFixed(2)}x</span>
                    </div>
                    <Slider value={[textScale]} onValueChange={(v) => setTextScale(v[0])} min={0.3} max={2} step={0.05} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Text Position Y</Label>
                      <span className="text-[10px] text-muted-foreground">{textPosY.toFixed(2)}</span>
                    </div>
                    <Slider value={[textPosY]} onValueChange={(v) => setTextPosY(v[0])} min={-1} max={1} step={0.05} />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2 pt-2">
                <Button variant="hero" size="lg" className="w-full"
                  onClick={() => {
                    const newItem = {
                      id: Date.now(),
                      name: "Custom T-Shirt Design",
                      slug: "custom-tshirt-" + Date.now(),
                      color: PALETTE.find(p => p.hex === shirtColor)?.name || "Custom Color",
                      size: selectedSize,
                      price: 1899,
                      qty: 1,
                      image: preview || "/assets/hero-tshirt.jpg"
                    };
                    try {
                      const existing = JSON.parse(localStorage.getItem('lemmewear_cart') || '[]');
                      const cartArray = Array.isArray(existing) ? existing : [];
                      cartArray.push(newItem);
                      localStorage.setItem('lemmewear_cart', JSON.stringify(cartArray));
                    } catch (e) {
                      console.error("Failed to add to cart", e);
                    }
                    toast.success("Added to cart!", { description: "Your custom design is saved." });
                    router.push("/cart");
                  }}>
                  <ShoppingBag className="h-4 w-4" /> Add to Cart · ₹1,899
                </Button>
                <Button variant="outline" size="lg" className="w-full border-primary/50 hover:bg-primary/5 text-primary hover:text-primary"
                  onClick={() => {
                    const customTee = {
                      id: "custom-" + Date.now(),
                      name: "Your Custom Design",
                      color: PALETTE.find(p => p.hex === shirtColor)?.name || "Custom Color",
                      price: 1899,
                      image: preview || "/assets/hero-tshirt.jpg"
                    };
                    localStorage.setItem("lemmewear_custom_gift_tshirt", JSON.stringify(customTee));
                    toast.success("Design saved!", { description: "Taking you to the Gift Pack builder..." });
                    router.push("/gift-packs");
                  }}>
                  <Gift className="h-4 w-4" /> Add to Gift Pack
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={handleSaveDesign} disabled={isSaving}>
                  {isSaving ? <RotateCw className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save to Dashboard"}
                </Button>
                <Button variant="ghost" size="lg" className="w-full text-muted-foreground"
                  onClick={() => toast("AI suggestions coming soon ✨")}>
                  <Sparkles className="h-4 w-4" /> AI Design Ideas
                </Button>
              </div>
            </aside>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
