import { COUNTRY_OPTIONS } from "@/lib/airshield";
import { cn } from "@/lib/utils";

export function CountryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COUNTRY_OPTIONS.map((c) => (
        <button
          key={c.code}
          type="button"
          onClick={() => onChange(c.code)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            value === c.code
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <span className="mr-1.5">{c.flag}</span>
          {c.name}
        </button>
      ))}
    </div>
  );
}
