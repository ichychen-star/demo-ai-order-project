export interface AiParseTextRequest {
  sourceText: string;
}

export interface AiParseResponse {
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  brand: string | null;
  model: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  options: string[] | null;
  expectedDeliveryMonth: string | null;
  confidence: number | null;
  missingFields: string[] | null;
}

export interface AiGenerateRequest {
  orderId: string;
}

export interface AiGenerateResponse {
  content: string;
}
