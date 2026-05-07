"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, Loader2, Mail, Lock, UserPlus, LogIn, ArrowRight,
  Sparkles, ShieldCheck, KeyRound, RefreshCw, CheckCircle2,
} from "lucide-react";

function LoginContent() {
  const { user, login, sendOtp, verifyOtpAndSignup, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  // "login" | "signup" | "otp"
  const [mode, setMode] = useState<"login" | "signup" | "otp">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!authLoading && user) router.replace(redirect);
  }, [authLoading, user, router, redirect]);

  useEffect(() => {
    document.title =
      mode === "login"
        ? "Sign In — LemmeWear"
        : mode === "signup"
        ? "Create Account — LemmeWear"
        : "Verify Email — LemmeWear";
  }, [mode]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Step 1: signup form → send OTP
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setSubmitting(true);
    const result = await sendOtp(name.trim(), email.trim());
    setSubmitting(false);
    if (result.success) {
      setMode("otp");
      setResendCooldown(60);
    } else {
      setError(result.error || "Failed to send OTP");
    }
  };

  // Step 2: OTP → verify + create account
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setSubmitting(true);
    const result = await verifyOtpAndSignup(name.trim(), email.trim(), password, otp.trim());
    setSubmitting(false);
    if (result.success) {
      router.replace(redirect);
    } else {
      setError(result.error || "Verification failed");
    }
  };

  // Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.success) {
      router.replace(redirect);
    } else {
      setError(result.error || "Something went wrong");
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSubmitting(true);
    const result = await sendOtp(name.trim(), email.trim());
    setSubmitting(false);
    if (result.success) {
      setOtp("");
      setResendCooldown(60);
    } else {
      setError(result.error || "Failed to resend OTP");
    }
  };

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setError("");
    setOtp("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  const leftTitle =
    mode === "login"
      ? "Welcome back to your style journey"
      : mode === "otp"
      ? "One last step"
      : "Start your style journey today";

  const leftDesc =
    mode === "login"
      ? "Sign in to track orders, manage your wishlist, and access your saved designs."
      : mode === "otp"
      ? "We sent a 6-digit code to your email. Enter it to verify your identity and activate your account."
      : "Create an account to unlock exclusive designs, earn rewards, and build your custom wardrobe.";

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
            <span className="text-4xl font-black tracking-widest uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
              LEMMEWEAR
            </span>
          </Link>
          <h2 className="text-4xl font-bold mb-4 leading-tight">{leftTitle}</h2>
          <p className="text-white/80 text-lg mb-10 max-w-md">{leftDesc}</p>
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
                <p className="font-semibold text-sm">Secure &amp; Private</p>
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
            <span className="text-3xl font-black tracking-widest uppercase text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              LEMMEWEAR
            </span>
          </Link>

          {/* Mode tabs — hidden on OTP step */}
          {mode !== "otp" && (
            <div className="flex rounded-xl bg-secondary p-1 mb-8">
              <button
                onClick={() => switchMode("login")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-smooth ${
                  mode === "login" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode("signup")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-smooth ${
                  mode === "signup" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* ── OTP step ── */}
          {mode === "otp" ? (
            <>
              <button
                onClick={() => { setMode("signup"); setError(""); setOtp(""); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back
              </button>

              <div className="mb-6">
                <div className="h-12 w-12 rounded-2xl gradient-primary grid place-items-center mb-4">
                  <KeyRound className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-1">Check your email</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 mb-6 text-sm text-destructive animate-fade-up">
                  {error}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Verification Code
                  </Label>
                  <Input
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(val);
                    }}
                    placeholder="Enter 6-digit code"
                    className="mt-1.5 h-14 text-center text-2xl font-bold tracking-[0.5em] placeholder:text-base placeholder:tracking-normal"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Check your inbox and spam folder. Code expires in 10 minutes.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-12 text-base gap-2"
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <><CheckCircle2 className="h-5 w-5" /> Verify &amp; Create Account</>
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || submitting}
                    className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </p>
              </div>
            </>

          ) : mode === "signup" ? (
            /* ── Signup form ── */
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-1">Create your account</h1>
                <p className="text-sm text-muted-foreground">Join us — it only takes a minute</p>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 mb-6 text-sm text-destructive animate-fade-up">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
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
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Min. 6 characters"
                      className="pl-10 pr-10 h-12"
                      autoComplete="new-password"
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
                  ) : (
                    <><Mail className="h-5 w-5" /> Send Verification Code</>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Sign in <ArrowRight className="h-3 w-3" />
                  </button>
                </p>
              </div>
            </>

          ) : (
            /* ── Login form ── */
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-1">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to continue to your account</p>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 mb-6 text-sm text-destructive animate-fade-up">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12"
                      autoComplete="current-password"
                      required
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
                  ) : (
                    <><LogIn className="h-5 w-5" /> Sign In</>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Create one <ArrowRight className="h-3 w-3" />
                  </button>
                </p>
              </div>
            </>
          )}

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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
