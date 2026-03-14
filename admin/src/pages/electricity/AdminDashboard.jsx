import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Divider, Badge, Tooltip, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as ApplicationIcon,
  Report as ComplaintIcon,
  Speed as MeterIcon,
  People as ConsumerIcon,
  ManageAccounts as UsersIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  Bolt as TariffIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  ElectricBolt,
  ChevronRight,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DRAWER_WIDTH = 255;

const NAV_ITEMS = [
  { label: 'Dashboard',        icon: DashboardIcon,    path: '/electricity' },
  { label: 'Applications',     icon: ApplicationIcon,  path: '/electricity/applications',  badgeKey: 'pending_applications' },
  { label: 'Complaints',       icon: ComplaintIcon,    path: '/electricity/complaints',     badgeKey: 'open_complaints' },
  { label: 'Meter Readings',   icon: MeterIcon,        path: '/electricity/meter-readings' },
  { label: 'Consumers',        icon: ConsumerIcon,     path: '/electricity/consumers' },
  { label: 'Users',            icon: UsersIcon,        path: '/electricity/users' },
  { label: 'Reports',          icon: ReportsIcon,      path: '/electricity/reports' },
  { label: 'Tariff Rates',     icon: TariffIcon,       path: '/electricity/tariff' },
  { label: 'System Settings',  icon: SettingsIcon,     path: '/electricity/settings' },
];

export default function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/dashboard/stats');
        setBadges(res.data);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => { logout(); navigate('/electricity/login'); };

  const isActive = (path) =>
    path === '/electricity'
      ? location.pathname === '/electricity'
      : location.pathname.startsWith(path);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0d1b2a' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ElectricBolt sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#fff" lineHeight={1.2}>Electricity</Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.45)">Admin Panel</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mx: 1.5 }} />

      <List sx={{ flex: 1, py: 1.5, px: 1 }}>
        {NAV_ITEMS.map(({ label, icon: Icon, path, badgeKey }) => {
          const active = isActive(path);
          const count = badgeKey ? (badges[badgeKey] || 0) : 0;
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={() => { navigate(path); if (isMobile) setMobileOpen(false); }}
                sx={{
                  borderRadius: 1.5,
                  py: 0.9,
                  px: 1.5,
                  bgcolor: active ? '#1976d2' : 'transparent',
                  '&:hover': { bgcolor: active ? '#1565c0' : 'rgba(255,255,255,0.06)' },
                  transition: 'background 0.15s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <Badge badgeContent={count > 0 ? count : null} color="error" max={99}>
                    <Icon sx={{ fontSize: 19, color: active ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: '0.83rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  }}
                />
                {active && <ChevronRight sx={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mx: 1.5 }} />

      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: '0.8rem', flexShrink: 0 }}>
          {user?.full_name?.[0]?.toUpperCase() || 'A'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} color="#fff" noWrap sx={{ fontSize: '0.8rem' }}>
            {user?.full_name || 'Admin'}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.4)" sx={{ fontSize: '0.68rem' }}>
            {user?.role || 'admin'}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton onClick={handleLogout} size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ef5350' } }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      {isMobile && (
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: '#0d1b2a', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar variant="dense">
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <ElectricBolt sx={{ mr: 0.5, color: '#64b5f6' }} />
            <Typography variant="subtitle1" fontWeight={700}>Electricity Admin</Typography>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Logout">
              <IconButton color="inherit" size="small" onClick={handleLogout}><LogoutIcon /></IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      )}

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
          <Box sx={{ width: DRAWER_WIDTH, height: '100vh', position: 'fixed', top: 0, left: 0, overflow: 'auto' }}>
            {drawer}
          </Box>
        </Box>
      )}

      <Box component="main" sx={{ flex: 1, minWidth: 0, mt: isMobile ? 6 : 0, p: { xs: 2, md: 3 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
