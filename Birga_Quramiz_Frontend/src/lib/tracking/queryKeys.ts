export const queryKeys = {
  drivers: {
    all:        () => ["tracking", "drivers"]                         as const,
    list:       () => ["tracking", "drivers", "list"]                 as const,
    detail:     (id: string) => ["tracking", "drivers", id, "detail"] as const,
    assignments:(id: string) => ["tracking", "drivers", id, "assignments"] as const,
    stats:         (id: string) => ["tracking", "drivers", id, "stats"]          as const,
    ratingSummary: (id: string) => ["tracking", "drivers", id, "rating-summary"] as const,
  },
  assignments: {
    events: (id: string) => ["tracking", "assignments", id, "events"] as const,
  },
  orders: {
    all:        () => ["tracking", "orders"]                as const,
    assignable: () => ["tracking", "orders", "assignable"]  as const,
  },
  fraudFlags: {
    all: () => ["tracking", "fraud-flags"] as const,
  },
} as const;
