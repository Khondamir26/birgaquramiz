export const queryKeys = {
  drivers: {
    all:  () => ["tracking", "drivers"]           as const,
    list: () => ["tracking", "drivers", "list"]   as const,
  },
  orders: {
    all:        () => ["tracking", "orders"]                as const,
    assignable: () => ["tracking", "orders", "assignable"]  as const,
  },
  fraudFlags: {
    all: () => ["tracking", "fraud-flags"] as const,
  },
} as const;
