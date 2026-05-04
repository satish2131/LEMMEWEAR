"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, Loader2, Mail, Lock, UserPlus, LogIn, ArrowRight, Sparkles, ShieldCheck
} from "lucide-react";

function LoginContent() {
  const { user, login, signup, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [authLoading, user, router, redirect]);

  useEffect(() => {
    document.title = mode === "login" ? "Sign In — LemmeWear" : "Create Account — LemmeWear";
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    let result;
    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your name");
        setSubmitting(false);
        return;
      }
      result = await signup(name.trim(), email.trim(), password);
    } else {
      result = await login(email.trim(), password);
    }

    if (result.success) {
      router.replace(redirect);
    } else {
      setError(result.error || "Something went wrong");
    }
    setSubmitting(false);
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/20 animate-float" />
          <div className="absolute bottom-32 right-16 h-48 w-48 rounded-full bg-white/15" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white/10 animate-float" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link href="/" className="mb-12">
            <span
              className="text-4xl font-black tracking-widest uppercase"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              LEMMEWEAR
            </span>
          </Link>

          <h2 className="text-4xl font-bold mb-4 leading-tight">
            {mode === "login"
              ? "Welcome back to your style journey"
              : "Start your style journey today"}
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-md">
            {mode === "login"
              ? "Sign in to track orders, manage your wishlist, and access your saved designs."
              : "Create an account to unlock exclusive designs, earn rewards, and build your custom wardrobe."}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 grid place-items-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">100 Welcome Points</p>
                <p className="text-white/70 text-xs">Earn rewards on every purchase</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 grid place-items-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Secure & Private</p>
                <p className="text-white/70 text-xs">Your data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block mb-8 text-center">
            <span
              className="text-3xl font-black tracking-widest uppercase text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              LEMMEWEAR
            </span>
          </Link>

          {/* Mode tabs */}
          <div className="flex rounded-xl bg-secondary p-1 mb-8">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-smooth ${
                mode === "login"
                  ? "bg-background shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-smooth ${
                mode === "signup"
                  ? "bg-background shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to continue to your account"
                : "Join us — it only takes a minute"}
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 mb-6 text-sm text-destructive animate-fade-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="animate-fade-up">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <div className="relative mt-1.5">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="pl-10 h-12"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 h-12"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                  className="pl-10 pr-10 h-12"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full h-12 text-base gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "login" ? (
                <><LogIn className="h-5 w-5" /> Sign In</>
              ) : (
                <><UserPlus className="h-5 w-5" /> Create Account</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={switchMode}
                className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                {mode === "login" ? "Create one" : "Sign in"}
                <ArrowRight className="h-3 w-3" />
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-smooth">
              ← Back to LemmeWear
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
