"use client";
import Link from "next/link";

export default function MarketplaceOverview() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/dashboard/marketplace/listings" className="bg-white shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Buy & Sell</h2>
          <p className="text-gray-500">Browse listings or sell your items</p>
        </Link>
        <Link href="/dashboard/marketplace/shops" className="bg-white shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Shops</h2>
          <p className="text-gray-500">Discover school vendors</p>
        </Link>
        <Link href="/dashboard/marketplace/lost-found" className="bg-white shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Lost & Found</h2>
          <p className="text-gray-500">Report lost or found items</p>
        </Link>
        <Link href="/dashboard/marketplace/accommodation" className="bg-white shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Accommodation</h2>
          <p className="text-gray-500">Find hostels & apartments</p>
        </Link>
        <Link href="/dashboard/marketplace/roommates" className="bg-white shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Roommates</h2>
          <p className="text-gray-500">Find or offer a shared room</p>
        </Link>
        <Link href="/dashboard/marketplace/services" className="bg-white shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Services</h2>
          <p className="text-gray-500">Offer or hire services</p>
        </Link>
        <Link href="/dashboard/marketplace/jobs" className="bg-white shadow rounded p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold">Jobs</h2>
          <p className="text-gray-500">Campus job listings</p>
        </Link>
      </div>
    </div>
  );
}