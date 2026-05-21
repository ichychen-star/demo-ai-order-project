import type { SxProps, Theme } from '@mui/material/styles';

export function getHighlightSx(fieldName: string, highlightedFields: Set<string>): SxProps<Theme> {
  if (!highlightedFields.has(fieldName)) return {};
  return { '& .MuiInputBase-root': { bgcolor: '#fffde7' } };
}
