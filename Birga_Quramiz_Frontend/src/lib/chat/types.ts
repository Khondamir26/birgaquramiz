export interface AiMaterial {
  name: string;
  quantity: string;
  unit: string;
  reason: string;
}

export interface AiProduct {
  id?: string;
  slug: string;
  name: string;
  price: string;
  imageUrl?: string;
  reason: string;
  quantity?: number;
  inStock?: boolean;
  stockCount?: number;
}

export interface AiAction {
  type: 'add_to_cart' | 'calculate' | 'find_builder' | 'contact_seller' | string;
  label: string;
}

export interface InputOption {
  label: string;
  value: string;
}

export interface InputRequest {
  type: 'number' | 'select' | 'text';
  field: string;
  label: string;
  unit?: string;
  quickValues?: number[];
  options?: InputOption[];
}

export interface AiStructuredResponse {
  message: string;
  materials: AiMaterial[];
  products: AiProduct[];
  actions: AiAction[];
  suggestions: string[];
  inputRequest?: InputRequest;
  remaining?: number;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  structured?: AiStructuredResponse;
  timestamp: number;
}

export interface ProjectContext {
  area?: number;
  type?: string;
  budget?: number;
  location?: string;
  extra?: Record<string, string>;
}
