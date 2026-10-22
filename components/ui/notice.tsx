import { cn } from "@/lib/cn";

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-3xl border px-4 py-4 text-base leading-7",
        tone === "info" && "border-line bg-sky text-ink",
        tone === "error" && "border-[#f0c2b6] bg-[#fff1ec] text-ink",
        tone === "success" && "border-[#cfe3d4] bg-leaf-soft text-ink",
      )}
    >
      {children}
    </div>
  );
}
