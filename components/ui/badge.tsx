import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        /** Primary brand color for default/active states */
        default: 'bg-primary/10 text-primary border border-primary/20',
        
        /** Destructive state for errors and critical alerts */
        destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
        
        /** Success state for completed actions */
        success: 'bg-success/10 text-success border border-success/20',
        
        /** Warning state for cautions and medium priority */
        warning: 'bg-warning/10 text-warning border border-warning/20',
        
        /** Info state for informational content */
        info: 'bg-info/10 text-info border border-info/20',
        
        /** Subtle state for secondary information */
        subtle: 'bg-muted text-muted-foreground border border-border',
        
        /** Outline state with just border and text */
        outline: 'bg-transparent text-foreground border border-border',
        
        /** Category: Timetable */
        'category-timetable': 'bg-category-timetable-bg text-category-timetable border border-category-timetable/20',
        
        /** Category: Planner */
        'category-planner': 'bg-category-planner-bg text-category-planner border border-category-planner/20',
        
        /** Category: Events */
        'category-events': 'bg-category-events-bg text-category-events border border-category-events/20',
        
        /** Category: AI Tools */
        'category-ai': 'bg-category-ai-bg text-category-ai border border-category-ai/20',
        
        /** Category: Marketplace */
        'category-marketplace': 'bg-category-marketplace-bg text-category-marketplace border border-category-marketplace/20',
        
        /** Category: Campus Map */
        'category-campus': 'bg-category-campus-bg text-category-campus border border-category-campus/20',
        
        /** Category: Emergency */
        'category-emergency': 'bg-category-emergency-bg text-category-emergency border border-category-emergency/20',
        
        /** Category: Community */
        'category-community': 'bg-category-community-bg text-category-community border border-category-community/20',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        default: 'text-xs px-3 py-1',
        lg: 'text-sm px-4 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Icon to display before text */
  icon?: React.ReactNode;
}

/**
 * Badge Component
 * 
 * Semantic badge/label/pill for categorization, status, and priority indicators.
 * Uses design tokens for consistent styling across themes.
 * 
 * Variants:
 * - **Semantic:** default, destructive, success, warning, info, subtle, outline
 * - **Categories:** timetable, planner, events, ai, marketplace, campus, emergency, community
 * 
 * @example
 * ```tsx
 * <Badge variant="default">Active</Badge>
 * <Badge variant="destructive" size="sm">Error</Badge>
 * <Badge variant="category-timetable" icon={<Clock />}>Timetable</Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={badgeVariants({ variant, size, className })}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </div>
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
