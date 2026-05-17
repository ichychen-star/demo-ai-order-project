'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const resetForm = useOrderStore((s) => s.resetForm);

  const handleSubmit = async (values: OrderFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const order = await orderApi.createOrder({
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
      resetForm();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      const msg = apiErr.errors?.length ? apiErr.errors.join('、') : apiErr.message;
      setError(msg || '儲存失敗，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          建立訂單
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <OrderForm
        onSubmit={handleSubmit}
        actions={
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? '儲存中...' : '儲存訂單'}
          </Button>
        }
      />
    </AppShell>
  );
}
