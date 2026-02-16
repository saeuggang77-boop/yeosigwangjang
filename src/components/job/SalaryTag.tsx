import type { SalaryLevel } from "@/lib/salary-guide";

const STYLE: Record<
  NonNullable<SalaryLevel>,
  { bg: string; text: string }
> = {
  above: { bg: "bg-success/15", text: "text-success" },
  average: { bg: "bg-primary/15", text: "text-primary-light" },
  below: { bg: "bg-urgent/15", text: "text-urgent" },
};

export default function SalaryTag({
  level,
  label,
  size = "sm",
}: {
  level: SalaryLevel;
  label: string;
  size?: "sm" | "xs";
}) {
  if (!level) return null;
  const s = STYLE[level];
  const textSize = size === "xs" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${s.bg} ${s.text} ${textSize}`}
    >
      {level === "above" && "\u25B2 "}
      {level === "below" && "\u25BC "}
      {label}
    </span>
  );
}
