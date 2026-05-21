'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import AppShell from '@/components/layout/AppShell';
import AiEmailPanel from '@/components/ai/AiEmailPanel';
import AiInputPanel from '@/components/order/AiInputPanel';
import AiSummaryPanel from '@/components/ai/AiSummaryPanel';
import OrderForm from '@/components/order/OrderForm';
import type { OrderFormValues } from '@/features/orders/useOrderForm';
import type { ApiError } from '@/services/apiClient';
import { orderApi } from '@/services/orderApi';
import { useOrderStore } from '@/store/orderStore';

export default function NewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false, severity: 'success', message: '',
  });
  const currentOrder = useOrderStore((s) => s.currentOrder);

  const handleSubmit = async (values: OrderFormValues) => {
    setSaving(true);
    try {
      await orderApi.createOrder({
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
      setToast({ open: true, severity: 'success', message: 'Order created successfully.' });
    } catch (err) {
      const apiErr = err as ApiError;
      const msg = apiErr.errors?.length ? apiErr.errors.join(', ') : apiErr.message;
      setToast({ open: true, severity: 'error', message: msg || 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Create Order
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/orders')}>
          Back to List
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <AiInputPanel />
      </Box>

      <OrderForm
        onSubmit={handleSubmit}
        actions={
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </Button>
        }
      />

      <Box
        sx={{
          mt: 4,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 3,
        }}
      >
        <AiSummaryPanel />
        <AiEmailPanel />
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
