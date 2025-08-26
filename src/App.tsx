// +++
import React, { Suspense } from "react";
// ...
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ⬇️ Lazy import: chỉ load StatsTab khi vào /stats
const StatsTab = React.lazy(() =>
  import("@/components/StatsTab").then((m) => ({ default: m.StatsTab || m.default }))
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/stats" element={<StatsTab />} /> {/* ✅ route mới */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
