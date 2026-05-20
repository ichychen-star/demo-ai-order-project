'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import AppShell from '@/components/layout/AppShell';
import OrderTable from '@/components/order/OrderTable';
import { orderApi } from '@/services/orderApi';
import { type Order, OrderStatus } from '@/types/order';

interface StatCard {
  label: string;
  count: number;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function SummaryCard({ label, count, sub, icon, iconBg, iconColor }: StatCard) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          bgcolor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500} lineHeight={1.4}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {count}
          </Typography>
          {sub && (
            <Typography variant="body2" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

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
      setError('Unable to load orders. Please try again.');
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
      setError('Failed to delete order. Please try again.');
    }
  };

  const total     = orders.length;
  const confirmed = orders.filter(o => o.status === OrderStatus.CONFIRMED).length;
  const draft     = orders.filter(o => o.status === OrderStatus.DRAFT).length;
  const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED).length;
  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';

  const statCards: StatCard[] = [
    {
      label: 'Total Orders',
      count: total,
      sub: `orders`,
      icon: <ReceiptLongIcon fontSize="small" />,
      iconBg: 'rgba(0, 113, 227, 0.10)',
      iconColor: '#0071E3',
    },
    {
      label: 'Confirmed',
      count: confirmed,
      sub: pct(confirmed),
      icon: <CheckCircleOutlineIcon fontSize="small" />,
      iconBg: 'rgba(52, 199, 89, 0.12)',
      iconColor: '#34C759',
    },
    {
      label: 'Draft',
      count: draft,
      sub: pct(draft),
      icon: <AccessTimeIcon fontSize="small" />,
      iconBg: 'rgba(255, 159, 10, 0.12)',
      iconColor: '#FF9F0A',
    },
    {
      label: 'Cancelled',
      count: cancelled,
      sub: pct(cancelled),
      icon: <CancelOutlinedIcon fontSize="small" />,
      iconBg: 'rgba(255, 59, 48, 0.10)',
      iconColor: '#FF3B30',
    },
  ];

  return (
    <AppShell>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Order Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View and manage all vehicle orders
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/orders/new')}
          sx={{ borderRadius: 2, px: 2.5, py: 1 }}
        >
          Create Order
        </Button>
      </Box>

      {/* Filter Area */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by customer name"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ width: 260, bgcolor: 'background.paper', borderRadius: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Select<OrderStatus | ''>
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
          displayEmpty
          renderValue={(v) => v === '' ? 'Status' : v}
          startAdornment={
            <InputAdornment position="start">
              <FilterListIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          }
          sx={{ width: 160, bgcolor: 'background.paper', borderRadius: 2 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value={OrderStatus.DRAFT}>Draft</MenuItem>
          <MenuItem value={OrderStatus.CONFIRMED}>Confirmed</MenuItem>
          <MenuItem value={OrderStatus.CANCELLED}>Cancelled</MenuItem>
        </Select>
      </Box>

      {error != null && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {statCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </Box>

      {/* Orders Table */}
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
