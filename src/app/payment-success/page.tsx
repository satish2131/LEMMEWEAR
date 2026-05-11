"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(4);
  const [status, setStatus] = useState<"waiting" | "ready">("waiting");

  useEffect(() => {
    document.title = "Payment Successful — LemmeWear";
  }, []);

  // Poll for order number — webhook may take a few seconds to fire
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // poll for up to 20s

    const poll = setInterval(() => {
      attempts++;
      const orderNumber = sessionStorage.getItem("lastOrderNumber");
      if (orderNumber) {
        setStatus("ready");
        clearInterval(poll);
      }
      if (attempts >= maxAttempts) {
        clearInterval(poll);
        // Give up polling — redirect anyway, order-confirmation will handle it
        setStatus("ready");
      }
    }, 1000);

    return () => clearInterval(poll);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (status !== "ready") return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, status]);

  // Navigate when countdown hits 0
  useEffect(() => {
    if (status === "ready" && countdown === 0) {
      router.replace("/order-confirmation");
    }
  }, [countdown, status, router]);

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

        {status === "waiting" ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Confirming your order...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              Redirecting in{" "}
              <span className="font-bold text-primary">{countdown}</span>s...
            </span>
          </div>
        )}

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
