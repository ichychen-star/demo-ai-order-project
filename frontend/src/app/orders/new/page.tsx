'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import AppShell from '@/components/layout/AppShell';
import AiSummaryPanel from '@/components/ai/AiSummaryPanel';
import AiInputPanel from '@/components/order/AiInputPanel';
import OrderForm from '@/components/order/OrderForm';
import type { OrderFormValues } from '@/features/orders/useOrderForm';
import type { ApiError } from '@/services/apiClient';
import { orderApi } from '@/services/orderApi';
import { useOrderStore } from '@/store/orderStore';

export default function NewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<string | undefined>();
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  });
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const resetForm = useOrderStore((s) => s.resetForm);

  useEffect(() => {
    resetForm();
    setSavedOrderId(undefined);
    setInitialized(true);
  }, [resetForm]);

  const handleSubmit = async (values: OrderFormValues) => {
    setSaving(true);
    try {
      const created = await orderApi.createOrder({
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
      setSavedOrderId(created.id);
      setToast({ open: true, severity: 'success', message: '訂單已成功儲存。' });
    } catch (err) {
      const apiErr = err as ApiError;
      const msg = apiErr.errors?.length ? apiErr.errors.join(', ') : apiErr.message;
      setToast({ open: true, severity: 'error', message: msg || '儲存失敗，請稍後再試。' });
    } finally {
      setSaving(false);
    }
  };

  if (!initialized) {
    return (
      <AppShell>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <ArticleOutlinedIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">建立訂單</Typography>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <AiInputPanel />
        </Box>

        <OrderForm
          onSubmit={handleSubmit}
          leftFooter={({ vehicleName }) => (
            <AiSummaryPanel orderId={savedOrderId} vehicleName={vehicleName} />
          )}
          actions={
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />}
                sx={{ px: 4, py: 1.4, fontWeight: 800 }}
              >
                {saving ? '儲存中...' : '儲存訂單'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push('/orders')}
                startIcon={<ArrowBackIcon />}
                sx={{ px: 3, py: 1.4, fontWeight: 800, bgcolor: 'background.paper' }}
              >
                返回列表
              </Button>
            </Box>
          }
        />
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </AppShell>
  );
}
