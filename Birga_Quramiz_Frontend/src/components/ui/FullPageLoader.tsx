"use client";

export type FullPageLoaderProps = {
  isOpen: boolean;
};

export default function FullPageLoader({ isOpen }: FullPageLoaderProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-l-transparent border-b-[#275fdb] animate-spin" />
        </div>
      </div>
    </div>
  );
}

/** Full-screen white page with a centered brand-blue spinner.
 *  Use this as the loading state for protected page layouts. */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1B4D91]/15 border-t-[#1B4D91]" />
    </div>
  );
}
