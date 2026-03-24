import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap border text-[11px] uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-mono",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:opacity-88",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:opacity-90",
        outline:
          "border-border bg-[color:var(--bg-page)] text-foreground hover:bg-[color:var(--bg-muted)]",
        secondary:
          "border-border bg-[color:var(--bg-muted)] text-foreground hover:bg-[color:var(--bg-surface)]",
        ghost: "border-border bg-transparent text-foreground hover:bg-[color:var(--bg-muted)]",
        link: "border-transparent bg-transparent px-0 text-foreground hover:text-muted-foreground",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
