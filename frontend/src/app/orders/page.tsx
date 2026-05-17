'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import AppShell from '@/components/layout/AppShell';
import OrderTable from '@/components/order/OrderTable';
import { orderApi } from '@/services/orderApi';
import { type Order, OrderStatus } from '@/types/order';

export default function OrderListPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.listOrders({
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
        ...(status ? { status } : {}),
      });
      setOrders(data);
    } catch {
      setError('無法載入訂單列表，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, [keyword, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleEdit = (id: string) => router.push(`/orders/${id}`);

  const handleDelete = async (id: string) => {
    try {
      await orderApi.deleteOrder(id);
      await fetchOrders();
    } catch {
      setError('刪除訂單失敗，請稍後再試。');
    }
  };

  return (
    <AppShell>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          訂單管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/orders/new')}
        >
          建立訂單
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="搜尋客戶名稱"
          size="small"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ width: 240 }}
        />
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>狀態</InputLabel>
          <Select<OrderStatus | ''>
            label="狀態"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value={OrderStatus.DRAFT}>Draft</MenuItem>
            <MenuItem value={OrderStatus.CONFIRMED}>Confirmed</MenuItem>
            <MenuItem value={OrderStatus.CANCELLED}>Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error != null && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <OrderTable orders={orders} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </AppShell>
  );
}
