"use client";

import { MarketplaceNav } from "@/components/marketplace/MarketplaceNav";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted pb-24">
      <MarketplaceNav />
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}