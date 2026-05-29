export class ProductModerationEvent {
  constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly sellerUserId: string,
    public readonly status: 'APPROVED' | 'REJECTED',
    public readonly reason?: string,
  ) {}
}

export class SellerStatusChangedEvent {
  constructor(
    public readonly sellerUserId: string,
    public readonly company: string,
    public readonly status: 'APPROVED' | 'REJECTED',
  ) {}
}
