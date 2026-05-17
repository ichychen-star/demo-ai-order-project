'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AppShell from '@/components/layout/AppShell';
import OrderForm from '@/components/order/OrderForm';

export default function NewOrderPage() {
  return (
    <AppShell>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          建立訂單
        </Typography>
      </Box>
      <OrderForm />
    </AppShell>
  );
}
