"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { User, Package, Heart, MapPin, Sparkles, LogOut, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { fetchUserProfile, updateUserProfile, fetchOrders } from "@/lib/api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  rewardPoints: number;
}

function AccountContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");

  const userEmail = user?.email || "";

  useEffect(() => {
    if (!userEmail) return;
    Promise.all([
      fetchUserProfile(userEmail),
      fetchOrders(userEmail),
    ])
      .then(([profileRes, ordersRes]) => {
        const p = profileRes.data as UserProfile;
        if (p) {
          setProfile(p);
          setFormName(p.name);
          setFormEmail(p.email);
          setFormPhone(p.phone || "");
          setFormCity(p.city || "");
        }
        const orders = ordersRes.data as unknown[];
        setOrderCount(orders?.length || 0);
      })
      .catch(() => {
        setProfile({ name: user?.name || "User", email: userEmail, rewardPoints: user?.rewardPoints || 0 });
        setFormName(user?.name || "");
        setFormEmail(userEmail);
      })
      .finally(() => setLoading(false));
  }, [userEmail, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateUserProfile({
        email: userEmail,
        name: formName,
        phone: formPhone,
        city: formCity,
      });
      setProfile(res.data as UserProfile);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    router.push("/");
  };

  const tiles = [
    { icon: Package, title: "Order History", desc: `${orderCount} order${orderCount !== 1 ? "s" : ""}`, href: "/account/orders" },
    { icon: Heart, title: "Wishlist", desc: "Saved items for later", href: "/account/wishlist" },
    { icon: Sparkles, title: "Saved Designs", desc: "Your customized creations", href: "/account/designs" },
    { icon: MapPin, title: "Addresses", desc: "Manage shipping locations", href: "/account/addresses" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1 container py-12">
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft text-center">
              <div className="h-20 w-20 rounded-full gradient-primary mx-auto grid place-items-center mb-3 shadow-glow">
                {user ? (
                  <span className="text-2xl font-bold text-primary-foreground uppercase">
                    {user.name.charAt(0)}
                  </span>
                ) : (
                  <User className="h-9 w-9 text-primary-foreground" />
                )}
              </div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
              ) : (
                <>
                  <h2 className="font-bold font-sans">{profile?.name || user?.name || "Welcome back"}</h2>
                  <p className="text-xs text-muted-foreground">{profile?.email || user?.email}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-accent text-primary font-medium">
                    <Sparkles className="h-3 w-3" /> {profile?.rewardPoints || user?.rewardPoints || 0} Reward Points
                  </div>
                </>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </aside>

          <section className="space-y-8">
            <div>
              <p className="text-sm font-medium text-primary mb-2">My Account</p>
              <h1 className="text-4xl font-bold">Dashboard</h1>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {tiles.map(({ icon: Icon, title, desc, href }) => (
                <Link key={title} href={href} className="text-left rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5 group">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 grid place-items-center rounded-xl gradient-primary mb-3"><Icon className="h-5 w-5 text-primary-foreground" /></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-smooth" />
                  </div>
                  <h3 className="font-semibold font-sans">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </Link>
              ))}
            </div>

            <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
              <h2 className="font-bold font-sans">Profile Settings</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Email</Label><Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="mt-1.5" disabled /></div>
                <div><Label>Phone</Label><Input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+91 ..." className="mt-1.5" /></div>
                <div><Label>City</Label><Input value={formCity} onChange={(e) => setFormCity(e.target.value)} className="mt-1.5" /></div>
              </div>
              <Button type="submit" variant="hero" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save changes"}
              </Button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountContent />
    </AuthGuard>
  );
}
