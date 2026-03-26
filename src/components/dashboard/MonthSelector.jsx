import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonthSelector({ month, year, onChange }) {
  const monthLabel = new Date(year, month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const prev = () => {
    const d = new Date(year, month - 1);
    onChange(d.getMonth(), d.getFullYear());
  };

  const next = () => {
    const d = new Date(year, month + 1);
    onChange(d.getMonth(), d.getFullYear());
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={prev}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold capitalize min-w-[160px] text-center">
        {monthLabel}
      </span>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={next}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}