"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    document.title = "Payment Successful — LemmeWear";
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
      router.replace("/order-confirmation");
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <div className="text-center px-6 animate-fade-up">
        {/* Success icon */}
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full gradient-primary shadow-glow mb-6">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Your payment has been confirmed. Your order is being prepared.
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>
            Redirecting to order confirmation in{" "}
            <span className="font-bold text-primary">{countdown}</span>s...
          </span>
        </div>

        <button
          onClick={() => router.replace("/order-confirmation")}
          className="mt-6 text-sm text-primary font-semibold hover:underline"
        >
          Go now →
        </button>
      </div>
    </div>
  );
}
