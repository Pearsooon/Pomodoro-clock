import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
<<<<<<< HEAD
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ⬇️ Lazy import: không load StatsTab (và recharts) cho đến khi vào /stats
const StatsTab = React.lazy(() =>
  import("@/components/StatsTab").then((m) => ({ default: m.StatsTab || m.default }))
);
=======
import { StatsTab } from "@/components/StatsTab";
>>>>>>> 76342f6a27e8a521ee0e69210f3bb3957dd5fa3c

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
<<<<<<< HEAD
        <ErrorBoundary>
          <Suspense fallback={<div />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/stats" element={<StatsTab />} /> {/* self-close ✅ */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
=======
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/stats" element={<StatsTab />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
>>>>>>> 76342f6a27e8a521ee0e69210f3bb3957dd5fa3c
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
