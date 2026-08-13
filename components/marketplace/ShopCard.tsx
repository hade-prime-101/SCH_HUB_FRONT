import { Card } from "@/components/ui/card";
import { Shop } from "@/types/marketplace";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Store, Star, Users } from "lucide-react";
import { Link } from 'react-router-dom';

interface ShopCardProps {
  shop: Shop;
  className?: string;
}

export function ShopCard({ shop, className }: ShopCardProps) {
  return (
    <Card className={cn("p-4 transition-all hover:shadow-md", className)}>
      <Link href={`/marketplace/shops/${shop.id}`} className="block">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover rounded-xl" />
            ) : (
              <Store className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{shop.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{shop.description}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {shop.rating?.toFixed(1) || "New"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {shop.followerCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}