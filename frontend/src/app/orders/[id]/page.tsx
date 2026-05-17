'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import AppShell from '@/components/layout/AppShell';
import OrderForm from '@/components/order/OrderForm';
import type { OrderFormValues } from '@/features/orders/useOrderForm';
import type { ApiError } from '@/services/apiClient';
import { orderApi } from '@/services/orderApi';
import { useOrderStore } from '@/store/orderStore';
import type { Order } from '@/types/order';

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentOrder = useOrderStore((s) => s.currentOrder);

  useEffect(() => {
    orderApi
      .getOrder(id)
      .then(setOrder)
      .catch(() => setFetchError('無法載入訂單，請稍後再試。'))
      .finally(() => setFetchLoading(false));
  }, [id]);

  const handleSubmit = async (values: OrderFormValues) => {
    setSaving(true);
    setSaveError(null);
    try {
      await orderApi.updateOrder(id, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail || undefined,
        vehicleId: values.vehicleId,
        exteriorColor: values.exteriorColor,
        interiorColor: values.interiorColor,
        optionIds: currentOrder.optionIds ?? [],
        expectedDeliveryMonth: values.expectedDeliveryMonth,
        status: values.status,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      const msg = apiErr.errors?.length ? apiErr.errors.join('、') : apiErr.message;
      setSaveError(msg || '儲存失敗，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  if (fetchLoading) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  if (fetchError || !order) {
    return (
      <AppShell>
        <Alert severity="error">{fetchError ?? '訂單不存在'}</Alert>
      </AppShell>
    );
  }

  const defaultValues: Partial<OrderFormValues> = {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? '',
    vehicleId: order.vehicleId,
    exteriorColor: order.exteriorColor,
    interiorColor: order.interiorColor,
    expectedDeliveryMonth: order.expectedDeliveryMonth,
    status: order.status,
  };

  const initialOptionIds = order.options.map((o) => o.optionId);

  return (
    <AppShell>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            編輯訂單
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.orderNo}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => router.push('/orders')}>
          返回列表
        </Button>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      <OrderForm
        defaultValues={defaultValues}
        initialOptionIds={initialOptionIds}
        onSubmit={handleSubmit}
        actions={
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? '儲存中...' : '儲存變更'}
          </Button>
        }
      />
    </AppShell>
  );
}
