'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

export const SIDEBAR_FULL_WIDTH = 240;
export const SIDEBAR_MINI_WIDTH = 64;

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       icon: <DashboardIcon />,     href: '/dashboard', enabled: false },
  { label: 'Vehicle Orders',  icon: <ListAltIcon />,       href: '/orders',    enabled: true  },
  { label: 'Vehicle Catalog', icon: <DirectionsCarIcon />, href: '/vehicles',  enabled: false },
  { label: 'Options Catalog', icon: <BuildIcon />,         href: '/options',   enabled: false },
  { label: 'AI Assistant',    icon: <SmartToyIcon />,      href: '/ai',        enabled: false },
  { label: 'Reports',         icon: <BarChartIcon />,      href: '/reports',   enabled: false },
  { label: 'Settings',        icon: <SettingsIcon />,      href: '/settings',  enabled: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const collapsed = useMediaQuery('(max-width:900px)');
  const width = collapsed ? SIDEBAR_MINI_WIDTH : SIDEBAR_FULL_WIDTH;

  const buttonSx = {
    borderRadius: 1,
    mb: 0.25,
    minHeight: 48,
    px: collapsed ? 1.5 : 2,
    justifyContent: collapsed ? 'center' : 'flex-start',
  } as const;

  const iconSx = {
    minWidth: collapsed ? 0 : 36,
    justifyContent: 'center',
  } as const;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ height: 64, display: 'flex', alignItems: 'center', px: collapsed ? 1.5 : 2, gap: 1 }}>
        <DirectionsCarIcon sx={{ color: 'primary.main', fontSize: 22, flexShrink: 0 }} />
        {!collapsed && (
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            AI Vehicle Order
          </Typography>
        )}
      </Box>

      <List sx={{ px: 0.5 }}>
        {NAV_ITEMS.map(({ label, icon, href, enabled }) => {
          const selected = enabled && pathname.startsWith(href);

          if (enabled) {
            return (
              <ListItemButton
                key={href}
                component={Link}
                href={href}
                selected={selected}
                sx={buttonSx}
              >
                <ListItemIcon sx={iconSx}>{icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={label} />}
              </ListItemButton>
            );
          }

          return (
            <ListItemButton key={href} disabled sx={buttonSx}>
              <ListItemIcon sx={iconSx}>{icon}</ListItemIcon>
              {!collapsed && <ListItemText primary={label} />}
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
            AD
          </Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.2} noWrap>Admin</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">admin@aivo.com</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
