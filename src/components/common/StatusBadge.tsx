import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning"
      | "accent";
  }
> = {
  zaposlen: { label: "Zaposlen", variant: "success" },
  v_procesu: { label: "V procesu", variant: "warning" },
  v_dogovoru: { label: "V dogovoru", variant: "accent" },
  mobilizacija: { label: "Mobilizacija", variant: "default" },
  aktiven: { label: "Aktiven", variant: "success" },
  zakljucevanje: { label: "Zaključevanje", variant: "warning" },
  zakljucen: { label: "Zaključen", variant: "secondary" },
  veljaven: { label: "Veljaven", variant: "success" },
  poteka_kmalu: { label: "Poteče kmalu", variant: "warning" },
  potekel: { label: "Potekel", variant: "destructive" },
  manjka: { label: "Manjka", variant: "outline" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}): React.JSX.Element {
  const config = statusConfig[status] || {
    label: status,
    variant: "outline" as const,
  };
  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {config.label}
    </Badge>
  );
}
