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
  customerName: z.string().min(1, '客戶名稱為必填'),
  customerPhone: z.string().min(1, '客戶電話為必填'),
  customerEmail: z.string().email('請輸入正確的電子郵件格式').or(z.literal('')).optional(),
  vehicleId: z.string().min(1, '請選擇車款'),
  exteriorColor: z.string().min(1, '外裝顏色為必填'),
  interiorColor: z.string().min(1, '內裝顏色為必填'),
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

  // Reactive vehicleId — triggers re-render when changed, used for price calc dependency
  const vehicleId = form.watch('vehicleId');

  // Sync form field changes to Zustand store — explicit per-field for type safety
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

  // Sync selected options to Zustand
  useEffect(() => {
    setField('optionIds', selectedOptionIds);
  }, [selectedOptionIds, setField]);

  // Debounced price calculation on vehicleId or optionIds change
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

  return {
    form,
    vehicles,
    vehiclesLoading,
    options,
    optionsLoading,
    selectedOptionIds,
    toggleOption,
    calculatedPrice,
  };
}
