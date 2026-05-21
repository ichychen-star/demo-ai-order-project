'use client';
import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { aiApi } from '@/services/aiApi';
import type { ApiError } from '@/services/apiClient';
import { useOrderStore } from '@/store/orderStore';

interface AiEmailPanelProps {
  orderId?: string;
}

export default function AiEmailPanel({ orderId }: AiEmailPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const aiEmail = useOrderStore((s) => s.aiEmail);
  const setAiEmail = useOrderStore((s) => s.setAiEmail);

  const handleGenerate = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.generateEmail({ orderId });
      setAiEmail(result.email ?? '');
    } catch (e) {
      setError((e as ApiError).message ?? 'AI 產生確認信失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!aiEmail) return;
    await navigator.clipboard.writeText(aiEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        客戶確認信
      </Typography>

      {!orderId && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          請先儲存訂單以產生客戶確認信。
        </Typography>
      )}

      {aiEmail && (
        <Box
          sx={{
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 1,
            p: 2,
            mb: 2,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          <Typography
            component="pre"
            variant="body2"
            sx={{ m: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
          >
            {aiEmail}
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={handleGenerate}
          disabled={!orderId || loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          AI 產生客戶確認信
        </Button>
        {aiEmail && (
          <Button variant="text" onClick={handleCopy}>
            {copied ? '已複製！' : '複製'}
          </Button>
        )}
      </Box>
    </Box>
  );
}
