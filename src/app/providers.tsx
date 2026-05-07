"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Load chat widget client-side only — no SSR needed
const ChatWidget = dynamic(() => import("@/components/site/ChatWidget"), { ssr: false });

function ChatWidgetWrapper() {
  const pathname = usePathname();
  // Hide on admin pages
  if (pathname?.startsWith("/admin")) return null;
  return <ChatWidget />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          {children}
          <ChatWidgetWrapper />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
