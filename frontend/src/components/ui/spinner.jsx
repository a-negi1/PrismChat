import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export function Spinner({ className, ...props }) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin text-primary", className)}
      {...props}
    />
  );
}
