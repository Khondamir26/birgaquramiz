interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function Suggestions({ suggestions, onSelect }: Props) {
  const actionChips = suggestions.filter((s) => s.trim().length > 0);
  if (actionChips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {actionChips.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-secondary transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
