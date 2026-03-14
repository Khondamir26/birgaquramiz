import { navbarIconMap } from "@/components/navbar/iconMap";
import { resolveImageUrl } from "@/lib/image";
import type { IconKey } from "@/config/navigation";

export type SearchPanelItem = {
  id: string;
  label: string;
  section: string;
  iconKey: IconKey;
  image?: string;
  href: string;
};

type SearchPanelProps = {
  query: string;
  results: SearchPanelItem[];
  onPick: (item: SearchPanelItem) => void;
  loading?: boolean;
};

export default function SearchPanel({ query, results, onPick, loading }: SearchPanelProps) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-[24px] border border-white/20 bg-white/98 p-3 text-slate-700 shadow-[0_24px_50px_-12px_rgba(10,35,102,0.3)] backdrop-blur-2xl">
      <div className="mb-2 flex items-center justify-between px-3 pt-1">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2154cb]/80">
          {query.trim() ? "Matches" : "Shortcuts"}
        </p>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="size-3 animate-spin rounded-full border-2 border-[#2154cb] border-t-transparent" />
          )}
          <p className="text-[11px] font-bold text-slate-300">
            {results.length} results
          </p>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="grid gap-1">
          {results.map((item) => {
            const Icon = !item.image ? navbarIconMap[item.iconKey] : null;

            return (
              <button
                key={item.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onPick(item)}
                className="flex items-center gap-3 rounded-[18px] px-3 py-2 text-left transition hover:bg-[#eef4ff] active:scale-[0.98]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#edf3ff] text-[#2154cb]">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.label}
                      className="h-full w-full object-contain p-1 mix-blend-multiply"
                    />
                  ) : (
                    Icon && <Icon className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-slate-700">{item.label}</span>
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-300">
                    {item.section}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50/50 px-4 py-8 text-center">
          <p className="text-[14px] font-bold text-slate-600">
            {loading ? "Searching..." : "No matches yet"}
          </p>
          <p className="mt-1 text-[12px] font-medium text-slate-400">
            {loading ? "Fetching live results from marketplace" : "Try another keyword in the navbar search."}
          </p>
        </div>
      )}
    </div>
  );
}
