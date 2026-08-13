import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/types/marketplace";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  service: Service;
  className?: string;
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  return (
    <Card className={cn("p-4 transition-all hover:shadow-md", className)}>
      <Link href={`/marketplace/services/${service.id}`} className="block">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{service.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
          </div>
          <Badge variant="category-marketplace">{service.category}</Badge>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-primary">₦{service.price.toLocaleString()}</span>
          <span className="text-muted-foreground">By {service.providerId}</span>
        </div>
      </Link>
    </Card>
  );
}