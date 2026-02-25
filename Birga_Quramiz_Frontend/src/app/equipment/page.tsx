import { Gauge, MapPinned, ShieldCheck, Truck } from "lucide-react";

const fleet = [
  { name: "Excavator CAT 320", rate: "340,000 UZS/hour", status: "Available now", location: "Tashkent" },
  { name: "Concrete Pump 42m", rate: "620,000 UZS/hour", status: "Booked until 16:00", location: "Chirchiq" },
  { name: "Tower Crane KTZ", rate: "1,200,000 UZS/day", status: "Available tomorrow", location: "Samarkand" },
];

export default function EquipmentPage() {
  return (
    <div className="page-shell space-y-6">
      <section className="surface-card p-6">
        <h1 className="section-title text-primary">Equipment Rental</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Book special machinery without посредники, track availability and keep documents in one place.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {fleet.map((item) => (
          <article key={item.name} className="surface-card p-5">
            <h2 className="text-lg font-bold text-primary">{item.name}</h2>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="size-4" /> {item.rate}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinned className="size-4" /> {item.location}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent">
              <Truck className="size-4" /> {item.status}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" /> GPS + docs verified
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
