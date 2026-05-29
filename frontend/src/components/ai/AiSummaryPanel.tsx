'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ColorLensOutlinedIcon from '@mui/icons-material/ColorLensOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { aiApi } from '@/services/aiApi';
import type { ApiError } from '@/services/apiClient';
import { useOrderStore } from '@/store/orderStore';
import { formatNtd } from '@/utils/formatPrice';

interface AiSummaryPanelProps {
  orderId?: string;
  vehicleName?: string | null;
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '24px minmax(110px, 1fr) minmax(72px, auto)', gap: 1.25, alignItems: 'center' }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} textAlign="right">{value || '—'}</Typography>
    </Box>
  );
}

export default function AiSummaryPanel({ orderId, vehicleName }: AiSummaryPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentOrder = useOrderStore((s) => s.currentOrder);
  const calculatedPrice = useOrderStore((s) => s.calculatedPrice);
  const aiSummary = useOrderStore((s) => s.aiSummary);
  const setAiSummary = useOrderStore((s) => s.setAiSummary);

  const handleGenerate = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.generateSummary({ orderId });
      setAiSummary(result.summary ?? '');
    } catch (e) {
      setError((e as ApiError).message ?? 'AI 產生摘要失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        minHeight: '100%',
        borderColor: 'rgba(12, 31, 59, 0.10)',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
        <ArticleOutlinedIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={800}>訂單摘要</Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr auto' },
          gap: { xs: 2, md: 3 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <SummaryItem icon={<PersonOutlineOutlinedIcon fontSize="small" />} label="客戶名稱" value={currentOrder.customerName} />
          <SummaryItem icon={<PhoneOutlinedIcon fontSize="small" />} label="客戶電話" value={currentOrder.customerPhone} />
          <SummaryItem icon={<DirectionsCarOutlinedIcon fontSize="small" />} label="車款" value={vehicleName} />
          <SummaryItem icon={<ColorLensOutlinedIcon fontSize="small" />} label="外裝顏色" value={currentOrder.exteriorColor} />
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <SummaryItem icon={<ColorLensOutlinedIcon fontSize="small" />} label="內裝顏色" value={currentOrder.interiorColor} />
          <SummaryItem icon={<CalendarMonthOutlinedIcon fontSize="small" />} label="預計交車" value={currentOrder.expectedDeliveryMonth} />
          <SummaryItem
            icon={<Inventory2OutlinedIcon fontSize="small" />}
            label="選配數量"
            value={currentOrder.optionIds?.length ? `${currentOrder.optionIds.length} 項` : '無'}
          />
          <SummaryItem
            icon={<ArticleOutlinedIcon fontSize="small" />}
            label="狀態"
            value={currentOrder.status ? currentOrder.status[0] + currentOrder.status.slice(1).toLowerCase() : undefined}
          />
        </Box>

        <Box sx={{ display: 'grid', gap: 1.25, justifyItems: { xs: 'start', md: 'center' } }}>
          <Button
            variant="outlined"
            onClick={handleGenerate}
            disabled={!orderId || loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeOutlinedIcon />}
            sx={{ fontWeight: 700, minWidth: 156 }}
          >
            AI 產生摘要
          </Button>
          {!orderId && (
            <Typography variant="body2" color="text.secondary">
              請先儲存訂單以產生 AI 摘要。
            </Typography>
          )}
        </Box>
      </Box>

      {calculatedPrice && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          目前總金額：{formatNtd(calculatedPrice.totalPrice)}
        </Typography>
      )}

      {aiSummary && (
        <Typography variant="body2" sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {aiSummary}
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  );
}
