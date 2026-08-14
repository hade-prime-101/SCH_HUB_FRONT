import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accommodation } from "@/types/marketplace";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AccommodationCardProps {
  accommodation: Accommodation;
  className?: string;
}

export function AccommodationCard({ accommodation, className }: AccommodationCardProps) {
  const { id, title, images, type, location, price } = accommodation;

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <Link href={`/marketplace/accommodation/${id}`} className="block">
        <div className="aspect-video w-full bg-muted relative">
          {images?.[0] ? (
            <img src={images[0]} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <Badge variant="category-campus" className="absolute right-2 top-2">
            {type.replace("_", " ")}
          </Badge>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/marketplace/accommodation/${id}`} className="block">
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        </Link>
        <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
          <span>{location}</span>
          <span className="font-bold text-primary">₦{price.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
}