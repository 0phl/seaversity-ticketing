"use client";

import { Loader2, type LucideProps } from "lucide-react";

export function Spinner({ className, ...props }: LucideProps) {
  return <Loader2 className={`animate-spin ${className}`} {...props} />;
}

export { Loader2 };
