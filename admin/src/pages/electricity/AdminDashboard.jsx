import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as ApplicationIcon,
  Report as ComplaintIcon,
  People as PeopleIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Power as PowerIcon,
  Receipt as BillIcon,
  FlashOn as ElectricityIcon,
  ContactMail as ConsumersIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/electricity/api';

const drawerWidth = 260;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [badges, setBadges] = useState({ applications: 0, complaints: 0 });

  useEffect(() => {
    // Fetch live badge counts
    api.get('/admin/dashboard/stats')
      .then((res) => {
        const data = res.data.data || res.data;
        setBadges({
          applications: data.pending_applications || 0,
          complaints: data.open_complaints || 0,
        });
      })
      .catch(() => {});
  }, []);

  const menuItems = [
    { text: 'Dashboard', icon: DashboardIcon, path: '/electricity' },
    { text: 'Applications', icon: ApplicationIcon, path: '/electricity/applications', badge: badges.applications },
    { text: 'Complaints', icon: ComplaintIcon, path: '/electricity/complaints', badge: badges.complaints },
    { text: 'Meter Readings', icon: ElectricityIcon, path: '/electricity/meter-readings' },
    { text: 'Consumers', icon: ConsumersIcon, path: '/electricity/consumers' },
    { text: 'Users', icon: AccountIcon, path: '/electricity/users' },
    { text: 'Reports', icon: ReportsIcon, path: '/electricity/reports' },
    { text: 'Tariffs', icon: BillIcon, path: '/electricity/tariff' },
    { text: 'Settings', icon: SettingsIcon, path: '/electricity/settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/');
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.dark', color: 'white' }}>
        <PowerIcon sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h6" fontWeight={600}>
          SUVIDHA
        </Typography>
        <Typography variant="caption">
          Admin Panel
        </Typography>
      </Box>

      <List sx={{ px: 2, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.lighter',
                  '&:hover': {
                    bgcolor: 'primary.lighter',
                  },
                },
              }}
            >
              <ListItemIcon>
                {item.badge !== undefined && item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    <item.icon />
                  </Badge>
                ) : (
                  <item.icon />
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'primary.dark',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard - {user?.full_name}
          </Typography>

          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
          </Typography>

          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.full_name?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => navigate('/settings')}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminDashboard;
