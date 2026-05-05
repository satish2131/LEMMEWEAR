"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { GiftPacks } from "@/components/site/GiftPacks";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Check, Gift, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

// --- Data ---
const defaultTshirts = [
  { id: "t1", name: "Abstract Aurora", color: "Multicolor Print", price: 1499, image: "/tshirts/abstract.png" },
  { id: "t2", name: "Vintage Wash", color: "Faded Black", price: 1799, image: "/tshirts/vintage.png" },
  { id: "t3", name: "Tokyo Streetwear", color: "White Graphic", price: 1599, image: "/tshirts/streetwear.png" },
  { id: "t4", name: "Classic Blank", color: "Soft White", price: 999, image: "/tshirts/blank-tshirt.png" },
  { id: "t5", name: "Meme Core", color: "Funny Graphic", price: 1299, image: "/tshirts/meme.png" },
  { id: "t6", name: "Anime Print", color: "Japanese Art", price: 1899, image: "/tshirts/anime.png" },
  { id: "t7", name: "Typography", color: "Minimal Text", price: 1399, image: "/tshirts/typography.png" },
];

const accessories = [
  { id: "a1", name: "Lume Bifold Wallet", price: 499, image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400" },
  { id: "a2", name: "Embroidered Cap", price: 299, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400" },
  { id: "a3", name: "Leather Keychain", price: 199, image: "https://images.unsplash.com/photo-1584984647265-4f40fbb1010e?auto=format&fit=crop&q=80&w=400" },
  { id: "a4", name: "Minimal Watch", price: 799, image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=400" },
  { id: "a5", name: "Aviator Glasses", price: 599, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400" },
];

const chocolates = [
  { id: "c1", name: "Belgian Dark Box", price: 299, image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=400" },
  { id: "c2", name: "Assorted Pralines", price: 399, image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&q=80&w=400" },
  { id: "c3", name: "Hazelnut Truffles", price: 449, image: "https://images.unsplash.com/photo-1614088058869-7c1b827e80f2?auto=format&fit=crop&q=80&w=400" },
  { id: "c4", name: "Caramel Bites", price: 349, image: "https://images.unsplash.com/photo-1542843137-87f1a59146bb?auto=format&fit=crop&q=80&w=400" },
];

const packagings = [
  { id: "p1", name: "Kraft Paper Bag", price: 0, image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&q=80&w=400" },
  { id: "p2", name: "Premium Gift Box", price: 149, image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&q=80&w=400" },
  { id: "p3", name: "Luxury Velvet Box", price: 299, image: "https://images.unsplash.com/photo-1550983556-9a286c07abaf?auto=format&fit=crop&q=80&w=400" },
];

const STEPS = ["T-Shirt", "Accessories", "Chocolates", "Packaging", "Message & Preview"];

const GiftBoxBuilder = () => {
  const router = useRouter();
  const [tshirts, setTshirts] = useState(defaultTshirts);
  const [step, setStep] = useState(0);
  const [selectedTshirt, setSelectedTshirt] = useState<string | null>(null);
  const [selectedAcc, setSelectedAcc] = useState<string[]>([]);
  const [selectedChoc, setSelectedChoc] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState("p1");
  const [message, setMessage] = useState("");

  // Check for custom t-shirt coming from /customize
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lemmewear_custom_gift_tshirt");
      if (saved) {
        const parsed = JSON.parse(saved);
        setTshirts((prev) => {
          // Prevent duplicate insertion if navigating back and forth
          if (prev.some(t => t.id === parsed.id)) return prev;
          return [parsed, ...prev];
        });
        // Auto-select the custom t-shirt and clear it from storage so it doesn't persist forever
        setSelectedTshirt(parsed.id);
        localStorage.removeItem("lemmewear_custom_gift_tshirt");
      }
    } catch (e) {
      console.error("Failed to parse custom tshirt", e);
    }
  }, []);

  const toggleAcc = (id: string) =>
    setSelectedAcc((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const tshirtData = tshirts.find((t) => t.id === selectedTshirt);
  const accData = accessories.filter((a) => selectedAcc.includes(a.id));
  const chocData = chocolates.find((c) => c.id === selectedChoc);
  const packData = packagings.find((p) => p.id === selectedPack);

  const total =
    (tshirtData?.price ?? 0) +
    accData.reduce((s, a) => s + a.price, 0) +
    (chocData?.price ?? 0) +
    (packData?.price ?? 0);

  const canNext = () => {
    if (step === 0 && !selectedTshirt) { toast.error("Please select a t-shirt"); return false; }
    if (step === 4 && total === 0) { toast.error("Please build your gift box first"); return false; }
    return true;
  };

  const next = () => {
    if (canNext()) {
      if (step < 4) {
        setStep((s) => s + 1);
      } else {
        const giftBoxItem = {
          id: Date.now(),
          name: "Premium Gift Box",
          color: "Custom Selection",
          size: "Various",
          price: total,
          qty: 1,
          image: packData?.image || "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&q=80&w=400",
          slug: "custom-gift-box",
        };
        
        try {
          const existingCart = JSON.parse(localStorage.getItem('lemmewear_cart') || '[]');
          existingCart.push(giftBoxItem);
          localStorage.setItem('lemmewear_cart', JSON.stringify(existingCart));
        } catch(e) {
          localStorage.setItem('lemmewear_cart', JSON.stringify([giftBoxItem]));
        }

        toast.success("Gift box added to cart! 🎁");
        router.push('/cart');
      }
    }
  };
  const back = () => { if (step > 0) setStep((s) => s - 1); };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1">
        <GiftPacks />

        <section className="container py-10" id="builder">
          {/* Stepper */}
          <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-smooth ${
                    i === step ? "bg-primary text-primary-foreground shadow-glow"
                    : i < step ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                  {s}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Step content */}
            <div>
              {/* Step 0: T-Shirt */}
              {step === 0 && (
                <div className="animate-fade-up">
                  <h2 className="text-3xl font-bold mb-6 font-sans">Choose a T-Shirt</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {tshirts.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTshirt(t.id)}
                        className={`group relative flex flex-col rounded-2xl overflow-hidden border-2 text-left transition-all duration-300 ${selectedTshirt === t.id ? "border-primary shadow-glow ring-2 ring-primary/20 bg-card" : "border-border bg-card hover:border-primary/40 hover:-translate-y-1"}`}
                      >
                        <div className="aspect-square bg-muted w-full overflow-hidden relative">
                          <img src={t.image} alt={t.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <p className="font-bold text-sm leading-tight mb-1">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground mb-2">{t.color}</p>
                          <div className="mt-auto flex items-center justify-between">
                            <p className="text-sm font-black gradient-text">₹{t.price}</p>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${selectedTshirt === t.id ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-transparent"}`}>
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Accessories */}
              {step === 1 && (
                <div className="animate-fade-up">
                  <h2 className="text-3xl font-bold mb-2 font-sans">Add Accessories</h2>
                  <p className="text-muted-foreground mb-8">Elevate your gift with premium add-ons (optional)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {accessories.map((a) => (
                      <button key={a.id} onClick={() => toggleAcc(a.id)}
                        className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${selectedAcc.includes(a.id) ? "border-primary shadow-glow ring-2 ring-primary/20 bg-card" : "border-border bg-card hover:border-primary/40 hover:-translate-y-1"}`}>
                        <div className="aspect-square bg-muted w-full overflow-hidden relative">
                           <img src={a.image} alt={a.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           {selectedAcc.includes(a.id) && <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center"><div className="bg-background rounded-full p-1.5 shadow-lg"><Check className="h-5 w-5 text-primary" /></div></div>}
                        </div>
                        <div className="p-3 sm:p-4">
                          <p className="font-bold text-xs sm:text-sm leading-tight mb-1">{a.name}</p>
                          <p className="text-sm font-bold text-primary">+₹{a.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Chocolates */}
              {step === 2 && (
                <div className="animate-fade-up">
                  <h2 className="text-3xl font-bold mb-2 font-sans">Add Chocolates</h2>
                  <p className="text-muted-foreground mb-8">A sweet touch to your gift (optional)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <button onClick={() => setSelectedChoc(null)}
                      className={`group rounded-2xl border-2 p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 min-h-[160px] ${!selectedChoc ? "border-primary shadow-glow bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="text-xl font-bold opacity-50">✕</span>
                      </div>
                      <p className="font-bold text-sm sm:text-base">No Thanks</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Skip this step</p>
                    </button>
                    {chocolates.map((c) => (
                      <button key={c.id} onClick={() => setSelectedChoc(c.id)}
                        className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-1 ${selectedChoc === c.id ? "border-primary shadow-glow ring-2 ring-primary/20 bg-card" : "border-border bg-card hover:border-primary/40"}`}>
                        <div className="aspect-square bg-muted w-full overflow-hidden relative">
                           <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           {selectedChoc === c.id && <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center"><div className="bg-background rounded-full p-1.5 shadow-lg"><Check className="h-5 w-5 text-primary" /></div></div>}
                        </div>
                        <div className="p-3 sm:p-4">
                          <p className="font-bold text-xs sm:text-sm leading-tight mb-1">{c.name}</p>
                          <p className="text-sm font-bold text-primary">+₹{c.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Packaging */}
              {step === 3 && (
                <div className="animate-fade-up">
                  <h2 className="text-3xl font-bold mb-6 font-sans">Choose Packaging</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {packagings.map((p) => (
                      <button key={p.id} onClick={() => setSelectedPack(p.id)}
                        className={`group relative flex flex-col rounded-2xl overflow-hidden border-2 text-left transition-all duration-300 hover:-translate-y-1 ${selectedPack === p.id ? "border-primary shadow-glow ring-2 ring-primary/20 bg-card" : "border-border bg-card hover:border-primary/40"}`}>
                        <div className="aspect-square bg-muted w-full overflow-hidden relative">
                           <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           {selectedPack === p.id && <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center"><div className="bg-background rounded-full p-1.5 shadow-lg"><Check className="h-5 w-5 text-primary" /></div></div>}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-xs sm:text-sm leading-tight mb-1">{p.name}</p>
                          <p className="text-xs font-bold text-primary">{p.price === 0 ? "Free" : `+₹${p.price}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Message + Preview */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-up">
                  <div>
                    <h2 className="text-3xl font-bold mb-2 font-sans">Add a Personal Message</h2>
                    <p className="text-muted-foreground text-sm mb-4">Your message will be printed on a premium card inside the gift box.</p>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your heartfelt message here... 💜"
                      rows={4}
                      className="w-full rounded-2xl border-2 border-border bg-card px-5 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm"
                    />
                  </div>

                  <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-soft lg:hidden">
                    <h3 className="font-bold font-sans mb-5 flex items-center gap-2 text-lg"><Gift className="h-5 w-5 text-primary" /> Gift Box Preview</h3>
                    <div className="space-y-4">
                      {tshirtData && (
                        <div className="flex items-center gap-4">
                          <img src={tshirtData.image} alt={tshirtData.name} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                          <div className="flex-1 min-w-0 flex justify-between items-center">
                            <span className="font-bold text-sm truncate">{tshirtData.name}</span>
                            <span className="text-muted-foreground text-sm shrink-0">₹{tshirtData.price}</span>
                          </div>
                        </div>
                      )}
                      {accData.map((a) => (
                        <div key={a.id} className="flex items-center gap-4">
                          <img src={a.image} alt={a.name} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                          <div className="flex-1 min-w-0 flex justify-between items-center">
                            <span className="font-bold text-sm truncate">{a.name}</span>
                            <span className="text-muted-foreground text-sm shrink-0">+₹{a.price}</span>
                          </div>
                        </div>
                      ))}
                      {chocData && (
                        <div className="flex items-center gap-4">
                          <img src={chocData.image} alt={chocData.name} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                          <div className="flex-1 min-w-0 flex justify-between items-center">
                            <span className="font-bold text-sm truncate">{chocData.name}</span>
                            <span className="text-muted-foreground text-sm shrink-0">+₹{chocData.price}</span>
                          </div>
                        </div>
                      )}
                      {packData && (
                        <div className="flex items-center gap-4">
                          <img src={packData.image} alt={packData.name} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                          <div className="flex-1 min-w-0 flex justify-between items-center">
                            <span className="font-bold text-sm truncate">{packData.name}</span>
                            <span className="text-muted-foreground text-sm shrink-0">{packData.price === 0 ? "Free" : `+₹${packData.price}`}</span>
                          </div>
                        </div>
                      )}
                      {message && (
                        <div className="flex justify-between items-center bg-secondary p-3 rounded-xl mt-2">
                          <span className="font-bold text-sm">💌 Personal Message</span>
                          <span className="text-primary text-sm font-bold">Included</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t-2 border-dashed border-border mt-5 pt-4 flex justify-between items-center font-black text-xl">
                      <span>Total</span>
                      <span className="gradient-text">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                {step > 0 && <Button variant="outline" size="lg" onClick={back}>← Back</Button>}
                <Button variant="hero" size="lg" className="flex-1" onClick={next}>
                  {step === 4 ? <><ShoppingBag className="h-4 w-4" /> Add to Cart — ₹{total.toLocaleString("en-IN")}</> : <>Continue <ChevronRight className="h-4 w-4" /></>}
                </Button>
              </div>
            </div>

            {/* Live box summary sidebar */}
            <aside className="rounded-3xl border-2 border-border bg-card overflow-hidden shadow-soft h-fit sticky top-24 hidden lg:flex lg:flex-col">
              <div className="bg-secondary p-5 border-b border-border">
                <h2 className="text-lg font-bold font-sans flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Your Gift Box</h2>
              </div>
              <div className="p-6 space-y-5">
                {!selectedTshirt && !selectedAcc.length && !selectedChoc && (
                  <div className="text-center py-10 opacity-60">
                    <Gift className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm">Start building to see<br/>your box here.</p>
                  </div>
                )}
                
                {tshirtData && (
                  <div className="flex items-center gap-4 animate-fade-up">
                    <img src={tshirtData.image} alt={tshirtData.name} className="h-14 w-14 rounded-xl object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{tshirtData.name}</p>
                      <p className="text-xs text-muted-foreground">₹{tshirtData.price}</p>
                    </div>
                  </div>
                )}
                
                {accData.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 animate-fade-up">
                    <img src={a.image} alt={a.name} className="h-14 w-14 rounded-xl object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">+₹{a.price}</p>
                    </div>
                  </div>
                ))}
                
                {chocData && (
                  <div className="flex items-center gap-4 animate-fade-up">
                    <img src={chocData.image} alt={chocData.name} className="h-14 w-14 rounded-xl object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{chocData.name}</p>
                      <p className="text-xs text-muted-foreground">+₹{chocData.price}</p>
                    </div>
                  </div>
                )}
                
                {selectedPack && packData && (
                  <div className="flex items-center gap-4 animate-fade-up">
                    <img src={packData.image} alt={packData.name} className="h-14 w-14 rounded-xl object-cover bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{packData.name}</p>
                      <p className="text-xs text-muted-foreground">{packData.price === 0 ? "Free" : `+₹${packData.price}`}</p>
                    </div>
                  </div>
                )}

                {total > 0 && (
                  <div className="border-t-2 border-dashed border-border pt-5 mt-2">
                    <div className="flex justify-between items-center font-black text-xl">
                      <span>Total</span>
                      <span className="gradient-text">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GiftBoxBuilder;
