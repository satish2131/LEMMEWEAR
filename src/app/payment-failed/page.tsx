"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    document.title = "Payment Failed — LemmeWear";
  }, []);

  // Tick the countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Navigate only when countdown reaches 0 — outside the state updater
  useEffect(() => {
    if (countdown === 0) {
      router.replace("/checkout");
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6 animate-fade-up max-w-md mx-auto">
        {/* Failed icon */}
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-100 mb-6">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold mb-2 text-foreground">Payment Failed</h1>
        <p className="text-muted-foreground mb-2 max-w-sm mx-auto">
          Your payment could not be processed. No amount has been charged.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          This can happen due to insufficient funds, network issues, or a cancelled transaction.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button variant="hero" className="gap-2" onClick={() => router.replace("/checkout")}>
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => router.replace("/")}>
            Back to Home
          </Button>
        </div>

        {/* Help */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Need help?</p>
          <p>
            If your account was debited, contact us at{" "}
            <a href="mailto:hello@lemmewear.in" className="text-primary font-medium hover:underline">
              hello@lemmewear.in
            </a>{" "}
            or call{" "}
            <a href="tel:+919876543210" className="text-primary font-medium hover:underline">
              +91 98765 43210
            </a>
          </p>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>
            Returning to checkout in{" "}
            <span className="font-bold text-foreground">{countdown}</span>s...
          </span>
        </div>
      </div>
    </div>
  );
}
