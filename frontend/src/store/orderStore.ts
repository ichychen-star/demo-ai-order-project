import { create } from 'zustand';
import type { CreateOrderRequest, PriceCalculationResponse } from '@/types/order';
import type { AiParseResponse } from '@/types/ai';

interface OrderState {
  currentOrder: Partial<CreateOrderRequest>;
  aiParseResult: AiParseResponse | null;
  /** Form field names auto-filled by AI — used to highlight fields in the UI */
  aiHighlightedFields: Set<string>;
  calculatedPrice: PriceCalculationResponse | null;
  aiSummary: string | null;
  isAiParsing: boolean;
  isSaving: boolean;
}

interface OrderActions {
  setField: <K extends keyof CreateOrderRequest>(field: K, value: CreateOrderRequest[K]) => void;
  setAiResult: (result: AiParseResponse) => void;
  setPriceResult: (price: PriceCalculationResponse) => void;
  setAiSummary: (summary: string) => void;
  setIsAiParsing: (parsing: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  resetForm: () => void;
}

type OrderStore = OrderState & OrderActions;

const createInitialState = (): OrderState => ({
  currentOrder: {},
  aiParseResult: null,
  aiHighlightedFields: new Set<string>(),
  calculatedPrice: null,
  aiSummary: null,
  isAiParsing: false,
  isSaving: false,
});

// Fields in AiParseResponse that map directly to CreateOrderRequest field names
const DIRECT_FIELD_MAP: ReadonlyArray<keyof AiParseResponse & keyof CreateOrderRequest> = [
  'customerName',
  'customerPhone',
  'customerEmail',
  'exteriorColor',
  'interiorColor',
  'expectedDeliveryMonth',
];

function computeHighlightedFields(result: AiParseResponse): Set<string> {
  const highlighted = new Set<string>();
  DIRECT_FIELD_MAP.forEach((key) => {
    if (result[key] != null) highlighted.add(key);
  });
  if (result.brand != null || result.model != null) highlighted.add('vehicleId');
  if (result.options != null && result.options.length > 0) highlighted.add('optionIds');
  return highlighted;
}

export const useOrderStore = create<OrderStore>((set) => ({
  ...createInitialState(),

  setField: (field, value) =>
    set((state) => ({ currentOrder: { ...state.currentOrder, [field]: value } })),

  setAiResult: (result) =>
    set(() => ({
      aiParseResult: result,
      aiHighlightedFields: computeHighlightedFields(result),
    })),

  setPriceResult: (price) => set({ calculatedPrice: price }),

  setAiSummary: (summary) => set({ aiSummary: summary }),

  setIsAiParsing: (parsing) => set({ isAiParsing: parsing }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  resetForm: () => set(createInitialState()),
}));
