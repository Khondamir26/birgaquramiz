import { CalendarClock, MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

export default function BuilderDetailPage() {
  const portfolio = ["Private house shell", "Facade insulation", "Turnkey apartment renovation"];

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <section className="surface-card p-6 md:p-8">
        <p className="text-sm font-medium text-muted-foreground">Builder Profile</p>
        <h1 className="mt-2 text-3xl font-black text-primary">Usta Pro Team</h1>
        <p className="mt-2 text-muted-foreground">Reliable crew for private housing and medium-size commercial projects.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <p className="text-xs text-muted-foreground">Rating</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xl font-black text-primary"><Star className="size-4 text-accent" /> 4.9</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <p className="text-xs text-muted-foreground">Service zone</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xl font-black text-primary"><MapPin className="size-4" /> Tashkent</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <p className="text-xs text-muted-foreground">Availability</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xl font-black text-primary"><CalendarClock className="size-4" /> Next week</p>
          </div>
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-xl font-bold text-primary">Portfolio</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {portfolio.map((item) => (
            <li key={item} className="inline-flex w-full items-center gap-2 rounded-lg border border-border/70 bg-white px-3 py-2">
              <ShieldCheck className="size-4 text-primary" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/ai-chat" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            Discuss estimate in AI chat
          </Link>
          <Link href="/builders" className="rounded-lg border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            Back to list
          </Link>
        </div>
      </section>
    </div>
  );
}
