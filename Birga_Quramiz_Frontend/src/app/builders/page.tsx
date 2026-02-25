import { BadgeCheck, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import Link from "next/link";

const builders = [
  { id: "builder-1", name: "Usta Pro Team", experience: "9 years", rating: 4.9, area: "Tashkent" },
  { id: "builder-2", name: "Master Beton Group", experience: "12 years", rating: 4.8, area: "Samarkand" },
  { id: "builder-3", name: "Archi Build Brigada", experience: "7 years", rating: 4.7, area: "Bukhara" },
];

export default function BuildersPage() {
  return (
    <div className="page-shell space-y-6">
      <section className="surface-card p-6">
        <h1 className="section-title text-primary">Verified Builders</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Compare portfolios, confirmed experience, service zones and schedule availability before signing contracts.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {builders.map((builder) => (
          <article key={builder.id} className="surface-card p-5">
            <div className="mb-3 inline-flex rounded-full bg-primary/10 p-2 text-primary">
              <BriefcaseBusiness className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-primary">{builder.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{builder.experience} experience • {builder.area}</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-accent">
              <BadgeCheck className="size-4" />
              Rating {builder.rating}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" />
              Tech-supervision verified
            </div>
            <Link href={`/builders/${builder.id}`} className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-accent">
              View profile
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
