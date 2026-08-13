"use client";
import Link from "next/link";

export default function MarketplaceOverview() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/marketplace/listings" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Buy & Sell</h2>
          <p className="text-muted-foreground">Browse listings or sell your items</p>
        </Link>
        <Link href="/marketplace/shops" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Shops</h2>
          <p className="text-muted-foreground">Discover school vendors</p>
        </Link>
        <Link href="/marketplace/lost-found" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Lost & Found</h2>
          <p className="text-muted-foreground">Report lost or found items</p>
        </Link>
        <Link href="/marketplace/accommodation" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Accommodation</h2>
          <p className="text-muted-foreground">Find hostels & apartments</p>
        </Link>
        <Link href="/marketplace/roommates" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Roommates</h2>
          <p className="text-muted-foreground">Find or offer a shared room</p>
        </Link>
        <Link href="/marketplace/services" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Services</h2>
          <p className="text-muted-foreground">Offer or hire services</p>
        </Link>
        <Link href="/marketplace/jobs" className="bg-card shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Jobs</h2>
          <p className="text-muted-foreground">Campus job listings</p>
        </Link>
      </div>
    </div>
  );
}