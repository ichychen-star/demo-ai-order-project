'use client';

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import Sidebar from './Sidebar';
import appleTheme from '@/theme/theme';
import { type ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export default function AppShell({ children, rightPanel }: AppShellProps) {
  return (
    <ThemeProvider theme={appleTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, py: 3, px: 2, minWidth: 0 }}>
          {children}
        </Box>
        {rightPanel != null && (
          <Box sx={{ width: 360, flexShrink: 0, borderLeft: 1, borderColor: 'divider', p: 2 }}>
            {rightPanel}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
