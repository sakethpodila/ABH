export type Preparation = 'with-egg' | 'eggless' | 'not-applicable';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined';
export type FulfilmentStatus = 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partially-paid' | 'paid';
export type OrderSource = 'instagram' | 'whatsapp' | 'other';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AdminIdentity {
  subject: string;
  email: string;
  localPreview: boolean;
}

// Future quote/order/invoice lines must copy agreed values instead of reading live prices.
export interface AgreedLineItem {
  productId: string | null;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPricePaise: number;
}
