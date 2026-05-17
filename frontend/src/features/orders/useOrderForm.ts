import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vehicleApi } from '@/services/vehicleApi';
import { useOrderStore } from '@/store/orderStore';
import { OrderStatus } from '@/types/order';
import type { Vehicle } from '@/types/vehicle';

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

export function useOrderForm(defaultValues?: Partial<OrderFormValues>) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const setField = useOrderStore((s) => s.setField);

  useEffect(() => {
    setVehiclesLoading(true);
    vehicleApi
      .listVehicles()
      .then(setVehicles)
      .finally(() => setVehiclesLoading(false));
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

  // Sync form changes to Zustand store — explicit per-field for type safety
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

  return { form, vehicles, vehiclesLoading };
}
