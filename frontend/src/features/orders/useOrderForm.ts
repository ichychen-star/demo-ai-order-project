import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { orderApi } from '@/services/orderApi';
import { vehicleApi } from '@/services/vehicleApi';
import { useOrderStore } from '@/store/orderStore';
import { OrderStatus } from '@/types/order';
import type { Vehicle, VehicleOption } from '@/types/vehicle';

export const orderFormSchema = z.object({
  customerName: z.string().min(1, '請輸入客戶名稱'),
  customerPhone: z.string()
    .min(1, '請輸入客戶電話')
    .max(10, '電話不能超過 10 碼')
    .regex(/^\d+$/, '只能輸入數字'),
  customerEmail: z.string().email('請輸入正確的電子郵件格式').or(z.literal('')).optional(),
  vehicleId: z.string().min(1, '請選擇車款'),
  exteriorColor: z.string().min(1, '請選擇外裝顏色'),
  interiorColor: z.string().min(1, '請選擇內裝顏色'),
  expectedDeliveryMonth: z.string().min(1, '請選擇預計交車月份'),
  status: z.nativeEnum(OrderStatus),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export function useOrderForm(
  defaultValues?: Partial<OrderFormValues>,
  initialOptionIds?: string[],
) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [options, setOptions] = useState<VehicleOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(initialOptionIds ?? []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setField = useOrderStore((s) => s.setField);
  const setPriceResult = useOrderStore((s) => s.setPriceResult);
  const calculatedPrice = useOrderStore((s) => s.calculatedPrice);
  const aiParseResult = useOrderStore((s) => s.aiParseResult);
  const aiHighlightedFields = useOrderStore((s) => s.aiHighlightedFields);

  useEffect(() => {
    setVehiclesLoading(true);
    vehicleApi
      .listVehicles()
      .then(setVehicles)
      .finally(() => setVehiclesLoading(false));
  }, []);

  useEffect(() => {
    setOptionsLoading(true);
    vehicleApi
      .listOptions()
      .then(setOptions)
      .finally(() => setOptionsLoading(false));
  }, []);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      vehicleId: '',
      exteriorColor: '',
      interiorColor: '',
      expectedDeliveryMonth: '',
      status: OrderStatus.DRAFT,
      ...defaultValues,
    },
  });

  const vehicleId = form.watch('vehicleId');

  useEffect(() => {
    if (!defaultValues) return;
    if (defaultValues.customerName)          setField('customerName', defaultValues.customerName);
    if (defaultValues.customerPhone)         setField('customerPhone', defaultValues.customerPhone);
    if (defaultValues.customerEmail)         setField('customerEmail', defaultValues.customerEmail);
    if (defaultValues.vehicleId)             setField('vehicleId', defaultValues.vehicleId);
    if (defaultValues.exteriorColor)         setField('exteriorColor', defaultValues.exteriorColor);
    if (defaultValues.interiorColor)         setField('interiorColor', defaultValues.interiorColor);
    if (defaultValues.expectedDeliveryMonth) setField('expectedDeliveryMonth', defaultValues.expectedDeliveryMonth);
    if (defaultValues.status)                setField('status', defaultValues.status);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.customerName !== undefined) setField('customerName', values.customerName);
      if (values.customerPhone !== undefined) setField('customerPhone', values.customerPhone);
      if (values.customerEmail !== undefined) setField('customerEmail', values.customerEmail);
      if (values.vehicleId !== undefined) setField('vehicleId', values.vehicleId);
      if (values.exteriorColor !== undefined) setField('exteriorColor', values.exteriorColor);
      if (values.interiorColor !== undefined) setField('interiorColor', values.interiorColor);
      if (values.expectedDeliveryMonth !== undefined)
        setField('expectedDeliveryMonth', values.expectedDeliveryMonth);
      if (values.status !== undefined) setField('status', values.status);
    });
    return () => subscription.unsubscribe();
  }, [form, setField]);

  useEffect(() => {
    setField('optionIds', selectedOptionIds);
  }, [selectedOptionIds, setField]);

  useEffect(() => {
    if (!vehicleId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      orderApi
        .calculatePrice({ vehicleId, optionIds: selectedOptionIds })
        .then(setPriceResult)
        .catch(() => {});
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [vehicleId, selectedOptionIds, setPriceResult]);

  const toggleOption = useCallback((id: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  useEffect(() => {
    if (!aiParseResult) return;
    const opts = { shouldValidate: true, shouldDirty: true } as const;
    if (aiParseResult.customerName) form.setValue('customerName', aiParseResult.customerName, opts);
    if (aiParseResult.customerPhone) form.setValue('customerPhone', aiParseResult.customerPhone, opts);
    if (aiParseResult.customerEmail) form.setValue('customerEmail', aiParseResult.customerEmail, opts);
    if (aiParseResult.exteriorColor) form.setValue('exteriorColor', aiParseResult.exteriorColor, opts);
    if (aiParseResult.interiorColor) form.setValue('interiorColor', aiParseResult.interiorColor, opts);
    if (aiParseResult.expectedDeliveryMonth)
      form.setValue('expectedDeliveryMonth', aiParseResult.expectedDeliveryMonth, opts);

    if ((aiParseResult.brand || aiParseResult.model) && vehicles.length > 0) {
      const match = vehicles.find(
        (v) =>
          (!aiParseResult.brand || v.brand.toLowerCase() === aiParseResult.brand.toLowerCase()) &&
          (!aiParseResult.model || v.model.toLowerCase() === aiParseResult.model.toLowerCase()),
      );
      if (match) form.setValue('vehicleId', match.id, opts);
    }

    if (aiParseResult.options != null && aiParseResult.options.length > 0 && options.length > 0) {
      const matchedIds = aiParseResult.options
        .map((name) => options.find((opt) => opt.name.toLowerCase() === name.toLowerCase())?.id)
        .filter((id): id is string => id !== undefined);
      if (matchedIds.length > 0) setSelectedOptionIds(matchedIds);
    }
  }, [aiParseResult, form, vehicles, options]);

  return {
    form,
    vehicles,
    vehiclesLoading,
    options,
    optionsLoading,
    selectedOptionIds,
    toggleOption,
    calculatedPrice,
    aiHighlightedFields,
  };
}
