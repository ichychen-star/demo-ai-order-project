'use client';

import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import { type ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export default function AppShell({ children, rightPanel }: AppShellProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        {children}
      </Box>
      {rightPanel != null && (
        <Box
          sx={{
            width: 360,
            flexShrink: 0,
            borderLeft: 1,
            borderColor: 'divider',
            p: 2,
          }}
        >
          {rightPanel}
        </Box>
      )}
    </Box>
  );
}
