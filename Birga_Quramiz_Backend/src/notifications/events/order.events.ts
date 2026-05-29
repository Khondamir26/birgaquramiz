export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly shortId: string,
    public readonly sellerIds: string[],
    public readonly customerName: string,
    public readonly total: number,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly shortId: string,
    public readonly sellerUserIds: string[],
    public readonly status: 'CONFIRMED' | 'CANCELLED' | 'SHIPPED' | 'DELIVERED',
    public readonly actorRole: string,
  ) {}
}
