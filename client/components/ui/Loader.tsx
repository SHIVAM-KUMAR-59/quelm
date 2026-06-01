import { cn } from "@/lib/utils";

function Loader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="loader"
      className={cn(
        "flex min-h-screen items-center justify-center bg-background",
        className,
      )}
      {...props}
    >
      <div className="h-8 w-8 animate-pulse rounded-full border border-border bg-card" />
    </div>
  );
}

export { Loader };
