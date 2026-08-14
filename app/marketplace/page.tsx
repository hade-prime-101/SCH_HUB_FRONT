"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Wrench,
  Briefcase,
  Home,
  Users,
  Store,
  Megaphone,
  Heart,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { listListings, toggleSaveListing } from "@/lib/api/marketplace.api";
import type { Listing } from "@/types/marketplace";

const categories = [
  { href: "/marketplace/listings", label: "Listings", icon: Package, color: "category-marketplace" },
  { href: "/marketplace/services", label: "Services", icon: Wrench, color: "category-ai" },
  { href: "/marketplace/jobs", label: "Jobs", icon: Briefcase, color: "category-planner" },
  { href: "/marketplace/accommodation", label: "Accommodation", icon: Home, color: "category-campus" },
  { href: "/marketplace/roommates", label: "Roommates", icon: Users, color: "category-events" },
  { href: "/marketplace/shops", label: "Shops", icon: Store, color: "category-timetable" },
  { href: "/marketplace/lost-found", label: "Lost & Found", icon: Megaphone, color: "category-emergency" },
  { href: "/marketplace/saved", label: "Saved", icon: Heart, color: "category-community" },
];

export default function MarketplaceHome() {
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listListings({ page: 1, limit: 4 })
      .then((res) => setRecentListings(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (id: string) => {
    await toggleSaveListing(id);
    // update local state
    setRecentListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, saved: !item.saved } : item
      )
    );
  };

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground">
              Discover, buy, sell, and connect with your campus community.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/marketplace/listings/new">
              <PlusCircle className="h-4 w-4" />
              Sell Something
            </Link>
          </Button>
        </div>
      </section>

      {/* Category grid */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Explore</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <Card className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center transition-all hover:shadow-md hover:scale-[1.02]">
                <div className={`rounded-full bg-${color} p-3 text-${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
          <Button variant="link" asChild className="gap-1">
            <Link href="/marketplace/listings">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Button variant="outline" asChild className="h-auto flex-col py-4">
            <Link href="/marketplace/listings/new">
              <Package className="h-5 w-5" />
              <span className="text-xs">New Listing</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto flex-col py-4">
            <Link href="/marketplace/services/new">
              <Wrench className="h-5 w-5" />
              <span className="text-xs">Offer Service</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto flex-col py-4">
            <Link href="/marketplace/jobs/new">
              <Briefcase className="h-5 w-5" />
              <span className="text-xs">Post Job</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto flex-col py-4">
            <Link href="/marketplace/accommodation/new">
              <Home className="h-5 w-5" />
              <span className="text-xs">List Accommodation</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Recent listings */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent Listings</h2>
          <Button variant="link" asChild className="gap-1">
            <Link href="/marketplace/listings">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <p className="text-muted-foreground">No listings yet. Be the first to sell!</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onSave={handleSave} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}