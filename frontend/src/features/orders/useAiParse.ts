'use client';
import { useState } from 'react';
import { aiApi } from '@/services/aiApi';
import { useOrderStore } from '@/store/orderStore';
import type { ApiError } from '@/services/apiClient';

export function useAiParse() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAiResult = useOrderStore((s) => s.setAiResult);
  const setIsAiParsing = useOrderStore((s) => s.setIsAiParsing);

  const parseText = async (text: string): Promise<void> => {
    setLoading(true);
    setIsAiParsing(true);
    setError(null);
    try {
      const result = await aiApi.parseText({ sourceText: text });
      setAiResult(result);
    } catch (e) {
      setError((e as ApiError).message ?? 'AI 解析失敗，請稍後再試。');
    } finally {
      setLoading(false);
      setIsAiParsing(false);
    }
  };

  const parsePdf = async (file: File): Promise<void> => {
    setLoading(true);
    setIsAiParsing(true);
    setError(null);
    try {
      const result = await aiApi.parsePdf(file);
      setAiResult(result);
    } catch (e) {
      setError((e as ApiError).message ?? 'AI 解析失敗，請稍後再試。');
    } finally {
      setLoading(false);
      setIsAiParsing(false);
    }
  };

  return { loading, error, parseText, parsePdf };
}
