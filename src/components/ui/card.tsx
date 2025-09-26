import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "relative flex flex-col gap-6 rounded-xl border py-6 transition-colors duration-300",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground shadow-sm",
        elevated: "bg-gradient-to-br from-background/70 via-background/40 to-background/10 shadow-md backdrop-blur-sm border-white/10",
        glass: "bg-gradient-to-br from-black/40 via-black/30 to-black/10 backdrop-blur-md border-white/10 shadow-lg",
        subtle: "bg-muted/40 text-card-foreground/90 border-border/60",
      },
      accent: {
        none: "",
        primary: "hover:border-primary/50",
        glow: "hover:shadow-[0_0_0_1px_rgba(59,130,246,0.4)] hover:border-primary/40",
      },
      interactive: {
        false: "",
        true: "cursor-pointer group",
      }
    },
    defaultVariants: {
      variant: "default",
      accent: "none",
      interactive: false
    }
  }
)

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
  withHoverOverlay?: boolean
}

function Card({ className, variant, accent, interactive, withHoverOverlay = false, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, accent, interactive }), className)}
      {...props}
    >
      {withHoverOverlay && (
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.12),transparent_65%)]" />
      )}
      {/* content wrapper to ensure overlay layering */}
      <div className={cn(withHoverOverlay && "relative z-10")}>{props.children}</div>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
