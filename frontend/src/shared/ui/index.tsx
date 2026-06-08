import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib";

type Tone = "default" | "blue" | "green" | "amber" | "red" | "muted" | "success" | "warning";

const buttonVariants = cva(
  "ui-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-porcelain-sm hover:bg-primary/92",
        secondary: "border border-border bg-card text-foreground hover:bg-secondary",
        subtle: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/92",
        success: "bg-success text-success-foreground hover:bg-success/92",
        warning: "bg-warning text-warning-foreground hover:bg-warning/92"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-sm px-3",
        lg: "h-11 rounded-lg px-5",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: {
      variant: "secondary",
      size: "default"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ variant, size, className, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function Badge({ children, tone = "default", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("ui-badge", tone, className)}>{children}</span>;
}

export function Panel({ children, className = "", variant = "default" }: { children: ReactNode; className?: string; variant?: "default" | "soft" | "flat" }) {
  return <section className={cn("ui-panel", variant, className)}>{children}</section>;
}

export function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: Tone }) {
  return (
    <article className={cn("metric-card", tone)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-block">{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label>{label}{children}</label>;
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <section className="list-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </section>
  );
}

export function DataTable({
  columns,
  rows,
  getKey,
  renderMobileCard
}: {
  columns: { key: string; title: string; render: (row: any) => ReactNode; align?: "left" | "right" | "center" }[];
  rows: any[];
  getKey: (row: any) => string | number;
  renderMobileCard: (row: any) => ReactNode;
}) {
  return (
    <div className="data-view">
      <div className="table-wrap desktop-table">
        <table>
          <thead>
            <tr>{columns.map((column) => <th className={column.align ? `is-${column.align}` : ""} key={column.key}>{column.title}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getKey(row)}>
                {columns.map((column) => <td className={column.align ? `is-${column.align}` : ""} key={column.key}>{column.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-cards">{rows.map((row) => <div key={getKey(row)}>{renderMobileCard(row)}</div>)}</div>
    </div>
  );
}
