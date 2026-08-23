import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single canonical treatment for a page title.
 *
 * The app previously carried four competing variants across eleven pages:
 * a primary->blue-600 gradient, a primary->red-600 gradient, a
 * `via-primary/80 ... animate-gradient-x` gradient, and a plain bold heading.
 * Two of those relied on `animate-gradient-x`, a keyframe defined in no
 * Tailwind config, so the "animated" headings never animated.
 *
 * Gradient-clipped text is also deliberately gone: `bg-clip-text
 * text-transparent` gives no contrast guarantee at either end of the gradient,
 * and renders invisible if the background fails to paint.
 */
export const pageTitleClass =
  "font-display text-2xl md:text-3xl font-semibold tracking-tight";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Actions rendered opposite the title, e.g. a primary button or dialog. */
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className={cn(pageTitleClass, "flex items-center gap-2 md:gap-3")}>
          {Icon ? (
            <Icon
              className="h-6 w-6 md:h-7 md:w-7 text-primary shrink-0"
              aria-hidden="true"
            />
          ) : null}
          {title}
        </h1>
        {description ? (
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
