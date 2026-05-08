"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles, ShoppingBag, RotateCw, Gift,
  Image as ImageIcon, Type, Palette, Upload, X,
  Shirt, BookmarkPlus, ChevronLeft, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { buildDesignTextures, DesignPosition } from "@/lib/buildDesignTextures";
import CanvaColorPicker from "@/components/ui/CanvaColorPicker";
import { readActiveCart, writeActiveCart } from "@/lib/cartKey";
import { ShirtType } from "@/lib/constants/modelConfig";
import DesignDragOverlay from "@/components/Customizer/DesignDragOverlay";

const Viewer = dynamic(() => import("@/components/Customizer/Viewer"), { ssr: false });

// ─── Apparel model definitions ────────────────────────────────────────────────
const APPAREL_MODELS: { type: ShirtType; label: string; desc: string; emoji: string }[] = [
  { type: "regular",   label: "Regular Tee",      desc: "Classic crew neck fit",    emoji: "👕" },
  { type: "oversized", label: "Oversized Tee",     desc: "Relaxed boxy silhouette",  emoji: "🧥" },
  { type: "hoodie",    label: "Hoodie",            desc: "Cozy pullover with hood",  emoji: "🫧" },
  { type: "polo",      label: "Polo Shirt",        desc: "Smart collar design",      emoji: "🎽" },
];

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────
type SideTab = "models" | "edit" | "colors" | "text";

const SIDE_TABS: { id: SideTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "models", icon: Shirt,     label: "Models"  },
  { id: "edit",   icon: ImageIcon, label: "Edit"    },
  { id: "colors", icon: Palette,   label: "Colors"  },
  { id: "text",   icon: Type,      label: "Text"    },
];

// ─── Palette & fonts ──────────────────────────────────────────────────────────
const PALETTE = [
  { name: "White",  hex: "#f5f5f5" },
  { name: "Royal",  hex: "#7c3aed" },
  { name: "Plum",   hex: "#5b21b6" },
  { name: "Onyx",   hex: "#1a1a1a" },
  { name: "Navy",   hex: "#1e3a5f" },
  { name: "Rose",   hex: "#f43f5e" },
  { name: "Sage",   hex: "#4ade80" },
  { name: "Sky",    hex: "#38bdf8" },
  { name: "Amber",  hex: "#f59e0b" },
  { name: "Coral",  hex: "#fb923c" },
  { name: "Slate",  hex: "#64748b" },
  { name: "Teal",   hex: "#14b8a6" },
];

const FONTS = [
  // Sans-serif
  { name: "Arial",           value: "Arial, sans-serif" },
  { name: "Helvetica",       value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { name: "Verdana",         value: "Verdana, Geneva, sans-serif" },
  { name: "Tahoma",          value: "Tahoma, Geneva, sans-serif" },
  { name: "Trebuchet MS",    value: "'Trebuchet MS', sans-serif" },
  { name: "Segoe UI",        value: "'Segoe UI', Roboto, sans-serif" },
  { name: "Calibri",         value: "Calibri, sans-serif" },
  { name: "Candara",         value: "Candara, sans-serif" },
  { name: "Century Gothic",  value: "'Century Gothic', sans-serif" },
  { name: "Franklin Gothic", value: "'Franklin Gothic Medium', sans-serif" },
  { name: "Futura",          value: "Futura, sans-serif" },
  { name: "Gill Sans",       value: "'Gill Sans', sans-serif" },
  { name: "Optima",          value: "Optima, sans-serif" },
  { name: "Corbel",          value: "Corbel, sans-serif" },
  { name: "Avant Garde",     value: "'Avant Garde', sans-serif" },
  // Web / Google-style
  { name: "Inter",           value: "Inter, Arial, sans-serif" },
  { name: "Roboto",          value: "Roboto, sans-serif" },
  { name: "Open Sans",       value: "'Open Sans', sans-serif" },
  { name: "Lato",            value: "Lato, sans-serif" },
  { name: "Montserrat",      value: "Montserrat, sans-serif" },
  { name: "Oswald",          value: "Oswald, sans-serif" },
  { name: "Raleway",         value: "Raleway, sans-serif" },
  { name: "Nunito",          value: "Nunito, sans-serif" },
  { name: "Ubuntu",          value: "Ubuntu, sans-serif" },
  { name: "Poppins",         value: "Poppins, sans-serif" },
  // Serif
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Georgia",         value: "Georgia, serif" },
  { name: "Garamond",        value: "Garamond, serif" },
  { name: "Palatino",        value: "'Palatino Linotype', Palatino, serif" },
  { name: "Bookman",         value: "'Bookman Old Style', serif" },
  { name: "Baskerville",     value: "Baskerville, 'Baskerville Old Face', serif" },
  { name: "Cambria",         value: "Cambria, serif" },
  { name: "Constantia",      value: "Constantia, serif" },
  { name: "Hoefler Text",    value: "'Hoefler Text', serif" },
  { name: "Didot",           value: "Didot, serif" },
  { name: "Rockwell",        value: "Rockwell, serif" },
  { name: "Playfair",        value: "'Playfair Display', Georgia, serif" },
  // Monospace
  { name: "Courier New",     value: "'Courier New', Courier, monospace" },
  { name: "Lucida Console",  value: "'Lucida Console', Monaco, monospace" },
  { name: "Consolas",        value: "Consolas, monospace" },
  { name: "Monaco",          value: "Monaco, monospace" },
  // Display / Decorative
  { name: "Impact",          value: "Impact, Charcoal, sans-serif" },
  { name: "Arial Black",     value: "'Arial Black', Gadget, sans-serif" },
  { name: "Copperplate",     value: "Copperplate, fantasy" },
  { name: "Stencil",         value: "Stencil, fantasy" },
  { name: "Papyrus",         value: "Papyrus, fantasy" },
  { name: "Luminari",        value: "Luminari, fantasy" },
  // Cursive / Script
  { name: "Brush Script",    value: "'Brush Script MT', cursive" },
  { name: "Comic Sans",      value: "'Comic Sans MS', cursive, sans-serif" },
  { name: "Chalkduster",     value: "Chalkduster, fantasy" },
  { name: "Blippo",          value: "Blippo, fantasy" },
];

// ─── Variant data per apparel type ───────────────────────────────────────────
// Each variant has an id, label, and a preview image.
// Placeholder images use the existing model assets — swap for real collar-type
// renders when you have them.

interface Variant {
  id: string;
  label: string;
  image: string;
  glb?: string; // future: per-variant GLB
}

const VARIANTS: Record<string, Variant[]> = {
  regular: [
    { id: "regular-crew",    label: "Crew Neck",      image: "/assets/tshirt-aurora.jpg" },
    { id: "regular-vneck",   label: "V-Neck",         image: "/assets/tshirt-noctura.jpg" },
    { id: "regular-round",   label: "Round Neck",     image: "/assets/tshirt-horizon.jpg" },
    { id: "regular-scoop",   label: "Scoop Neck",     image: "/assets/tshirt-blush.jpg" },
    { id: "regular-henley",  label: "Henley",         image: "/assets/tshirt-sage.jpg" },
    { id: "regular-polo",    label: "Polo Collar",    image: "/assets/tshirt-onyx.jpg" },
  ],
  oversized: [
    { id: "over-crew",       label: "Crew Neck",      image: "/assets/tshirt-solstice.jpg" },
    { id: "over-drop",       label: "Drop Shoulder",  image: "/assets/tshirt-aurora.jpg" },
    { id: "over-boxy",       label: "Boxy Fit",       image: "/assets/tshirt-horizon.jpg" },
    { id: "over-longline",   label: "Longline",       image: "/assets/tshirt-noctura.jpg" },
  ],
  hoodie: [
    { id: "hoodie-pullover", label: "Pullover",       image: "/assets/tshirt-sage.jpg" },
    { id: "hoodie-zip",      label: "Full Zip",       image: "/assets/tshirt-blush.jpg" },
    { id: "hoodie-halfzip",  label: "Half Zip",       image: "/assets/tshirt-onyx.jpg" },
    { id: "hoodie-crop",     label: "Crop Hoodie",    image: "/assets/tshirt-aurora.jpg" },
  ],
  polo: [
    { id: "polo-classic",    label: "Classic Polo",   image: "/assets/tshirt-horizon.jpg" },
    { id: "polo-slim",       label: "Slim Fit",       image: "/assets/tshirt-noctura.jpg" },
    { id: "polo-pique",      label: "Piqué Polo",     image: "/assets/tshirt-solstice.jpg" },
    { id: "polo-rugby",      label: "Rugby Stripe",   image: "/assets/tshirt-blush.jpg" },
  ],
};

// ─── Models Panel ─────────────────────────────────────────────────────────────
function ModelsPanel({
  shirtType,
  setShirtType,
  selectedSize,
  setSelectedSize,
}: {
  shirtType: ShirtType;
  setShirtType: (t: ShirtType) => void;
  selectedSize: string;
  setSelectedSize: (s: string) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const categories: { type: ShirtType; label: string }[] = [
    { type: "regular",   label: "Regular Tee" },
    { type: "oversized", label: "Oversized"   },
    { type: "hoodie",    label: "Hoodie"      },
    { type: "polo",      label: "Polo"        },
  ];

  const variants = VARIANTS[shirtType] || [];

  return (
    <div className="flex flex-col gap-0 -mx-4 -mt-4">
      {/* ── Category tab strip ── */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map((cat) => {
          const active = shirtType === cat.type;
          return (
            <button
              key={cat.type}
              onClick={() => { setShirtType(cat.type); setSelectedVariant(null); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Section heading ── */}
      <div className="px-4 pb-2">
        <h3 className="font-bold text-sm text-foreground">
          {categories.find(c => c.type === shirtType)?.label} — Collar Styles
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          More variants coming soon. Click to select.
        </p>
      </div>

      {/* ── Variant grid ── */}
      <div className="px-3 grid grid-cols-3 gap-2 pb-4">
        {variants.map((v) => {
          const active = selectedVariant === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedVariant(active ? null : v.id)}
              className={`group relative flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                active
                  ? "border-primary shadow-glow"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Preview image */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <img
                  src={v.image}
                  alt={v.label}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Label on hover */}
              <div className={`absolute inset-x-0 bottom-7 flex items-end justify-center transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                <span className="bg-black/70 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {v.label}
                </span>
              </div>

              {/* Active checkmark */}
              {active && (
                <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow">
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Size selector ── */}
      <div className="px-4 pb-4 border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</span>
          <span className="text-xs text-primary font-semibold">{selectedSize}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`h-8 min-w-[2rem] px-2.5 rounded-lg border-2 text-xs font-bold transition-smooth ${
                selectedSize === size
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {shirtType === "oversized" && (
          <p className="text-[10px] text-muted-foreground mt-1.5">Oversized fit — size down if unsure</p>
        )}
      </div>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function Customize() {
  const router = useRouter();
  const { user } = useAuth();

  // Active sidebar tab
  const [activeTab, setActiveTab] = useState<SideTab>("models");

  // Design state
  const [shirtType, setShirtType]       = useState<ShirtType>("regular");
  const [shirtColor, setShirtColor]     = useState(PALETTE[0].hex);
  const [selectedSize, setSelectedSize] = useState("M");
  const [text, setText]                 = useState("YOUR\nIDENTITY");
  const [backText, setBackText]         = useState("");
  const [font, setFont]                 = useState(FONTS[0].value);
  const [textColor, setTextColor]       = useState("#1a1a1a");
  const [textScale, setTextScale]       = useState(1);
  const [textPos, setTextPos]           = useState<DesignPosition>({ x: 0, y: 0 });
  const [textPosBack, setTextPosBack]   = useState<DesignPosition>({ x: 0, y: 0 });
  const [imgScale, setImgScale]         = useState(1);
  const [imgPos, setImgPos]             = useState<DesignPosition>({ x: 0, y: 0 });
  const [imgPosBack, setImgPosBack]     = useState<DesignPosition>({ x: 0, y: 0 });
  // which side the viewer is showing (toggled by a button)
  const [viewSide, setViewSide]         = useState<"front" | "back">("front");
  const [imgShowFront, setImgShowFront] = useState(true);
  const [imgShowBack, setImgShowBack]   = useState(true);

  // Texture state
  const [designTexFront, setDesignTexFront] = useState<THREE.CanvasTexture | null>(null);
  const [designTexBack, setDesignTexBack]   = useState<THREE.CanvasTexture | null>(null);

  // Upload state
  const [preview, setPreview]               = useState<string | null>(null);
  const [uploadedImg, setUploadedImg]       = useState<HTMLImageElement | null>(null);
  const [previewBack, setPreviewBack]       = useState<string | null>(null);
  const [uploadedImgBack, setUploadedImgBack] = useState<HTMLImageElement | null>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const fileRefBack = useRef<HTMLInputElement>(null);

  // Viewer state
  const [autoRotate, setAutoRotate]     = useState(true);
  const resetCameraRef = useRef<(() => void) | null>(null);

  // Saving state
  const [isSaving, setIsSaving]         = useState(false);

  // Rebuild textures whenever design changes
  useEffect(() => {
    const { front, back } = buildDesignTextures({
      text,
      backText,
      font, textColor, textScale,
      textPos,
      textPosBack,
      imgScale,
      imgPos,
      imgPosBack,
      uploadedImg,
      uploadedImgBack,
      imgShowFront: uploadedImg !== null,
      imgShowBack:  uploadedImgBack !== null,
      textShowFront: text.trim().length > 0,
      textShowBack:  backText.trim().length > 0,
    });
    setDesignTexFront(old => { old?.dispose(); return front; });
    setDesignTexBack(old => { old?.dispose(); return back; });
  }, [text, backText, font, textColor, textScale, textPos, textPosBack,
      imgScale, imgPos, imgPosBack, uploadedImg, uploadedImgBack]);

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

  const loadImageBack = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setPreviewBack(src);
      const img = new window.Image();
      img.onload = () => setUploadedImgBack(img);
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) loadImage(f);
  };

  const handleUploadBack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) loadImageBack(f);
  };

  const removeImage = () => {
    setUploadedImg(null); setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImageBack = () => {
    setUploadedImgBack(null); setPreviewBack(null);
    if (fileRefBack.current) fileRefBack.current.value = "";
  };

  const handleSaveDesign = async () => {
    if (!user?.email) { toast.error("Please login to save your design"); router.push("/login"); return; }
    try {
      setIsSaving(true);
      const res = await fetch("/api/users/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          name: text.trim() || "My Custom Design",
          preview: preview || "/assets/hero-tshirt.jpg",
          config: { text, backText, font, textColor, shirtColor, textScale,
                    textPos, textPosBack, imgScale, imgPos, imgPosBack },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Design saved to your dashboard!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save design");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Panel content per tab ──────────────────────────────────────────────────
  const renderPanel = () => {
    switch (activeTab) {

      // ── MODELS tab ──────────────────────────────────────────────────────────
      case "models":
        return (
          <ModelsPanel
            shirtType={shirtType}
            setShirtType={setShirtType}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
          />
        );

      // ── EDIT tab ────────────────────────────────────────────────────────────
      case "edit":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-base mb-1">Upload Design</h3>
              <p className="text-xs text-muted-foreground">Add separate images for front and back</p>
            </div>

            {/* ── Front image ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Front Image
                </Label>
                {preview && <span className="text-[10px] text-primary font-semibold">● Applied</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" id="design-upload-front" onChange={handleUpload} />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Front design" className="w-full h-28 object-contain rounded-xl border border-border bg-secondary/20" />
                  <button onClick={removeImage}
                    className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded-full bg-background/90 border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                    aria-label="Remove front image">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label htmlFor="design-upload-front"
                  className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-accent/30 cursor-pointer transition-smooth">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Click to upload</p>
                    <p className="text-xs text-muted-foreground/60">PNG, JPG, SVG up to 10MB</p>
                  </div>
                </label>
              )}
            </div>

            {/* ── Back image ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Back Image
                </Label>
                {previewBack && <span className="text-[10px] text-primary font-semibold">● Applied</span>}
              </div>
              <input ref={fileRefBack} type="file" accept="image/*" className="hidden" id="design-upload-back" onChange={handleUploadBack} />
              {previewBack ? (
                <div className="relative">
                  <img src={previewBack} alt="Back design" className="w-full h-28 object-contain rounded-xl border border-border bg-secondary/20" />
                  <button onClick={removeImageBack}
                    className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded-full bg-background/90 border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                    aria-label="Remove back image">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label htmlFor="design-upload-back"
                  className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-accent/30 cursor-pointer transition-smooth">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Click to upload</p>
                    <p className="text-xs text-muted-foreground/60">Leave empty for no back image</p>
                  </div>
                </label>
              )}
            </div>

            {/* Image adjustments — shared scale/position */}
            {(preview || previewBack) && (
              <div className="space-y-4 p-3 rounded-xl border border-border bg-accent/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Image Size</p>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Size</Label>
                    <span className="text-[10px] text-muted-foreground">{imgScale.toFixed(2)}x</span>
                  </div>
                  <Slider value={[imgScale]} onValueChange={(v) => setImgScale(v[0])} min={0.3} max={2} step={0.05} />
                </div>
                <p className="text-[10px] text-muted-foreground">Drag the purple handle on the viewer to reposition</p>
              </div>
            )}
          </div>
        );

      // ── COLORS tab ──────────────────────────────────────────────────────────
      case "colors":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-base mb-1">Garment Color</h3>
              <p className="text-xs text-muted-foreground">Pick the base color of your apparel</p>
            </div>
            <CanvaColorPicker
              value={shirtColor}
              onChange={setShirtColor}
              swatches={PALETTE}
            />
          </div>
        );

      // ── TEXT tab ────────────────────────────────────────────────────────────
      case "text":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-base mb-1">Add Text</h3>
              <p className="text-xs text-muted-foreground">Type your message and style it</p>
            </div>

            {/* Front text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Front Text
                </Label>
                {text.trim() && (
                  <span className="text-[10px] text-primary font-semibold">● Applied</span>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Front side text..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Back text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Back Text
                </Label>
                {backText.trim() && (
                  <span className="text-[10px] text-primary font-semibold">● Applied</span>
                )}
              </div>
              <textarea
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                rows={3}
                placeholder="Back side text (optional)..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Leave empty to have no text on the back
              </p>
            </div>

            {/* Font picker */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Font</Label>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {FONTS.map((f) => (
                  <button key={f.name} onClick={() => setFont(f.value)}
                    style={{ fontFamily: f.value }}
                    className={`h-9 truncate px-2 rounded-lg border text-sm font-semibold transition-smooth ${
                      font === f.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"
                    }`}
                    title={f.name}>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Text color */}
            <CanvaColorPicker
              label="Text Color"
              value={textColor}
              onChange={setTextColor}
              swatches={[
                { name: "White",  hex: "#ffffff" },
                { name: "Black",  hex: "#000000" },
                { name: "Royal",  hex: "#7c3aed" },
                { name: "Rose",   hex: "#f43f5e" },
                { name: "Sky",    hex: "#38bdf8" },
                { name: "Sage",   hex: "#4ade80" },
                { name: "Gold",   hex: "#f59e0b" },
                { name: "Coral",  hex: "#fb923c" },
              ]}
            />

            {/* Text adjustments */}
            <div className="space-y-4 p-3 rounded-xl border border-border bg-accent/20">
              <div>
                <div className="flex justify-between mb-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Text Size</Label>
                  <span className="text-[10px] text-muted-foreground">{textScale.toFixed(2)}x</span>
                </div>
                <Slider value={[textScale]} onValueChange={(v) => setTextScale(v[0])} min={0.3} max={2} step={0.05} />
              </div>
              <p className="text-[10px] text-muted-foreground">Drag the blue handle on the viewer to reposition</p>
            </div>
          </div>
        );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16" />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

        {/* ── Top bar ── */}
        <div className="border-b border-border bg-card px-3 py-2.5 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight">Design Studio</h1>
              <p className="text-[11px] text-muted-foreground capitalize truncate">
                {APPAREL_MODELS.find(m => m.type === shirtType)?.label} · Size {selectedSize}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex h-8 px-3" onClick={handleSaveDesign} disabled={isSaving}>
              {isSaving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">Save</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 hidden md:flex h-8 px-3"
              onClick={() => {
                const customTee = { id: "custom-" + Date.now(), name: "Your Custom Design",
                  color: PALETTE.find(p => p.hex === shirtColor)?.name || "Custom", price: 1899,
                  image: preview || "/assets/hero-tshirt.jpg" };
                localStorage.setItem("lemmewear_custom_gift_tshirt", JSON.stringify(customTee));
                toast.success("Taking you to Gift Pack builder...");
                router.push("/gift-packs");
              }}>
              <Gift className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Gift Pack</span>
            </Button>
            <Button variant="hero" size="sm" className="gap-1.5 h-8 px-3 text-xs"
              onClick={() => {
                const newItem = { id: Date.now(), name: "Custom T-Shirt Design",
                  slug: "custom-tshirt-" + Date.now(),
                  color: PALETTE.find(p => p.hex === shirtColor)?.name || "Custom Color",
                  size: selectedSize, price: 1899, qty: 1,
                  image: preview || "/assets/hero-tshirt.jpg" };
                const cart = readActiveCart();
                cart.push(newItem);
                writeActiveCart(cart);
                toast.success("Added to cart!");
                router.push("/cart");
              }}>
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Add to Cart</span>
              <span className="hidden sm:inline"> · ₹1,899</span>
            </Button>
          </div>
        </div>

        {/* ── Studio body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left icon rail — desktop only ── */}
          <div className="hidden md:flex flex-col items-center gap-1 w-16 border-r border-border bg-card py-3 shrink-0">
            {SIDE_TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl text-[10px] font-semibold transition-smooth ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Left panel — desktop only ── */}
          <div className="w-72 border-r border-border bg-card overflow-y-auto shrink-0 hidden md:block">
            <div className="p-4">
              {renderPanel()}
            </div>
          </div>

          {/* ── 3D Viewport ── */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{ background: "radial-gradient(ellipse at 55% 35%, #e8e1fa 0%, #f0ecfc 45%, #e4dff5 100%)" }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(70% 60% at 50% 40%, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />

            {/* Viewer — leave bottom space for mobile panel */}
            <div className="absolute inset-0 md:inset-0" style={{ bottom: 0 }}>
              <Viewer
                shirtType={shirtType}
                color={shirtColor}
                designTexFront={designTexFront}
                designTexBack={designTexBack}
                showFront={viewSide === "front"}
                showBack={viewSide === "back"}
                autoRotate={autoRotate}
                onInteract={() => setAutoRotate(false)}
                onResetRef={resetCameraRef}
              />
              <DesignDragOverlay
                imgPos={imgPos}
                textPos={textPos}
                hasImage={uploadedImg !== null}
                hasText={text.trim().length > 0}
                imgPosBack={imgPosBack}
                textPosBack={textPosBack}
                hasImageBack={uploadedImgBack !== null}
                hasTextBack={backText.trim().length > 0}
                side={viewSide}
                onImgPosChange={setImgPos}
                onTextPosChange={setTextPos}
                onImgPosBackChange={setImgPosBack}
                onTextPosBackChange={setTextPosBack}
              />
            </div>

            {/* Front / Back toggle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/80 backdrop-blur rounded-full p-1 shadow-soft z-20">
              <button
                onClick={() => { setViewSide("front"); setAutoRotate(false); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${viewSide === "front" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Front
              </button>
              <button
                onClick={() => { setViewSide("back"); setAutoRotate(false); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${viewSide === "back" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Back
              </button>
            </div>

            {/* Reset camera */}
            <button
              onClick={() => { resetCameraRef.current?.(); setAutoRotate(true); }}
              className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-white/80 backdrop-blur shadow-soft hover:bg-white transition-smooth z-20"
              aria-label="Reset view"
            >
              <RotateCw className="h-3.5 w-3.5 text-primary" />
            </button>

            {/* Hint — hidden on very small screens */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-3 py-1.5 shadow-soft z-10">
              <span className="text-[11px] text-foreground/60 font-medium whitespace-nowrap">Drag handles · Scroll to zoom</span>
            </div>

            {/* AI ideas */}
            <button
              onClick={() => toast("AI design suggestions coming soon ✨")}
              className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-primary shadow-soft hover:bg-white transition-smooth z-10"
            >
              <Sparkles className="h-3 w-3" /> AI
            </button>
          </div>
        </div>

        {/* ── Mobile bottom panel ── */}
        <div className="md:hidden flex flex-col border-t border-border bg-card shrink-0" style={{ maxHeight: "45vh" }}>
          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            {SIDE_TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-smooth relative ${
                  activeTab === id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {activeTab === id && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-b" />
                )}
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {renderPanel()}
          </div>
        </div>

      </main>
    </div>
  );
}
