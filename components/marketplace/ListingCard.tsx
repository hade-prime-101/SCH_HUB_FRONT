import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Listing } from "@/types/marketplace";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

interface ListingCardProps {
  listing: Listing;
  onSave?: (id: string) => void;
  className?: string;
}

export function ListingCard({ listing, onSave, className }: ListingCardProps) {
  const { id, title, price, images, status, saved } = listing;

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <Link href={`/marketplace/listings/${id}`} className="block">
        <div className="aspect-video w-full bg-muted relative">
          {images?.[0] ? (
            <img src={images[0]} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <Badge
            variant={
              status === "ACTIVE"
                ? "success"
                : status === "PENDING"
                ? "warning"
                : status === "SOLD"
                ? "default"
                : "destructive"
            }
            className="absolute right-2 top-2"
          >
            {status}
          </Badge>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/marketplace/listings/${id}`} className="block">
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">₦{price.toLocaleString()}</span>
          {onSave && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.preventDefault();
                onSave(id);
              }}
              aria-label={saved ? "Unsave" : "Save"}
            >
              <Heart className={cn("h-4 w-4", saved && "fill-primary text-primary")} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}