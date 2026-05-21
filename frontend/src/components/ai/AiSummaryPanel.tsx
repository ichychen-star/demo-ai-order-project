'use client';
import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { aiApi } from '@/services/aiApi';
import type { ApiError } from '@/services/apiClient';
import { useOrderStore } from '@/store/orderStore';
import { formatNtd } from '@/utils/formatPrice';

interface AiSummaryPanelProps {
  orderId?: string;
}

function SummaryRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  );
}

export default function AiSummaryPanel({ orderId }: AiSummaryPanelProps) {
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
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        訂單摘要
      </Typography>

      <Box sx={{ mb: 2 }}>
        <SummaryRow label="客戶名稱" value={currentOrder.customerName} />
        <SummaryRow label="客戶電話" value={currentOrder.customerPhone} />
        <SummaryRow label="外裝顏色" value={currentOrder.exteriorColor} />
        <SummaryRow label="內裝顏色" value={currentOrder.interiorColor} />
        <SummaryRow label="預計交車" value={currentOrder.expectedDeliveryMonth} />
        <SummaryRow
          label="選配數量"
          value={currentOrder.optionIds?.length ? `${currentOrder.optionIds.length} 項` : '無'}
        />
        <SummaryRow
          label="總金額"
          value={calculatedPrice ? formatNtd(calculatedPrice.totalPrice) : undefined}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      {!orderId && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          請先儲存訂單以產生 AI 摘要。
        </Typography>
      )}

      {aiSummary && (
        <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {aiSummary}
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        variant="outlined"
        onClick={handleGenerate}
        disabled={!orderId || loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
      >
        AI 產生摘要
      </Button>
    </Box>
  );
}
