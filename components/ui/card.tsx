import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Compact padding (p-3 instead of p-5) */
  compact?: boolean;
  /** Remove default border */
  noBorder?: boolean;
  /** Remove default shadow */
  noShadow?: boolean;
  /** Hover effect (shadow and scale) */
  interactive?: boolean;
}

/**
 * Card Component
 * 
 * Lightweight wrapper for elevated surfaces with semantic token styling.
 * Used for grouping related content with consistent visual treatment.
 * 
 * Features:
 * - Semantic background and border colors
 * - Optional compact mode for dense layouts
 * - Interactive hover states
 * - Consistent border radius (rounded-2xl)
 * - Flexibly composable with children
 * 
 * @example
 * ```tsx
 * <Card>
 *   <h3 className="font-semibold">Title</h3>
 *   <p className="text-sm text-muted-foreground">Content</p>
 * </Card>
 * 
 * <Card compact interactive>
 *   <DenseListing />
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    compact = false,
    noBorder = false,
    noShadow = false,
    interactive = false,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl bg-card
          ${!noBorder ? 'border border-border' : ''}
          ${!noShadow ? 'shadow-sm' : ''}
          ${interactive ? 'transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer' : ''}
          ${compact ? 'p-3' : 'p-5'}
          ${className || ''}
        `}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader Component
 * 
 * Semantic header section for cards with consistent spacing and typography.
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Optional description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content here</CardContent>
 * </Card>
 * ```
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 pb-4 border-b border-border ${className || ''}`}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle Component
 * 
 * Semantic title text with consistent sizing and weight.
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold text-foreground ${className || ''}`}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription Component
 * 
 * Semantic description text with muted color.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className || ''}`}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

/**
 * CardContent Component
 * 
 * Main content area with consistent spacing.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`pt-4 ${className || ''}`} {...props} />
));

CardContent.displayName = 'CardContent';

/**
 * CardFooter Component
 * 
 * Footer section for actions or supplementary content.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center pt-4 border-t border-border ${className || ''}`}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
