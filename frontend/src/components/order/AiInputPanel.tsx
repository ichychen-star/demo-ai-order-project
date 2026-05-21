'use client';
import React, { useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAiParse } from '@/features/orders/useAiParse';
import { useOrderStore } from '@/store/orderStore';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export default function AiInputPanel() {
  const [tabIndex, setTabIndex] = useState<0 | 1>(0);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loading, error, parseText, parsePdf } = useAiParse();
  const aiParseResult = useOrderStore((s) => s.aiParseResult);

  const handleTabChange = (_: React.SyntheticEvent, newValue: 0 | 1) => {
    setTabIndex(newValue);
    setPdfError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_PDF_BYTES) {
      setPdfError('檔案超過 10MB 限制，請上傳較小的 PDF。');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setPdfError(null);
    setSelectedFile(file);
  };

  const handleParse = async () => {
    if (tabIndex === 0) {
      await parseText(text);
    } else if (selectedFile) {
      await parsePdf(selectedFile);
    }
  };

  const isParseDisabled =
    loading ||
    (tabIndex === 0 && !text.trim()) ||
    (tabIndex === 1 && !selectedFile);

  const displayError = error ?? pdfError;

  return (
    <Box>
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="貼上文字" />
        <Tab label="上傳 PDF" />
      </Tabs>

      {tabIndex === 0 && (
        <Box>
          <TextField
            multiline
            rows={5}
            fullWidth
            placeholder="將客戶需求文字貼上此處..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            inputProps={{ maxLength: 2000 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
            {text.length}/2000
          </Typography>
        </Box>
      )}

      {tabIndex === 1 && (
        <Box>
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {selectedFile ? selectedFile.name : '點擊選擇 PDF 檔案（最大 10MB）'}
            </Typography>
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      )}

      {displayError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {displayError}
        </Alert>
      )}

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={handleParse}
          disabled={isParseDisabled}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          AI 解析需求
        </Button>
        {aiParseResult?.confidence != null && (
          <Chip
            label={`信心度 ${Math.round(aiParseResult.confidence * 100)}%`}
            color={aiParseResult.confidence >= 0.7 ? 'success' : 'warning'}
            size="small"
          />
        )}
      </Box>

      {aiParseResult?.missingFields != null && aiParseResult.missingFields.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          未解析欄位：{aiParseResult.missingFields.join('、')}
        </Alert>
      )}
    </Box>
  );
}
