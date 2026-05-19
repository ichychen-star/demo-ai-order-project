import { createTheme } from '@mui/material/styles';

const appleTheme = createTheme({
  palette: {
    primary: {
      main: '#0071E3',
      dark: '#0058B0',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F7',
      paper:   '#FFFFFF',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    text: {
      primary:   'rgba(0, 0, 0, 0.85)',
      secondary: 'rgba(0, 0, 0, 0.50)',
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
        outlined: { borderColor: 'rgba(0, 0, 0, 0.08)' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.15)' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F5F5F7',
            fontWeight: 600,
            fontSize: '0.75rem',
            color: 'rgba(0, 0, 0, 0.50)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:last-child .MuiTableCell-body': { borderBottom: 0 } },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 113, 227, 0.10)',
            color: '#0071E3',
            '& .MuiListItemIcon-root': { color: '#0071E3' },
            '&:hover': { backgroundColor: 'rgba(0, 113, 227, 0.15)' },
          },
        },
      },
    },
  },
});

export default appleTheme;
