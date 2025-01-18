import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  AccountCircle,
  Home as HomeIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 280;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [error, setError] = useState('');

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Sotuvchilar', icon: <PeopleIcon />, path: '/sellers' },
    { text: 'Kategoriyalar', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Mahsulotlar', icon: <InventoryIcon />, path: '/products' },
    { text: 'Statistika', icon: <TrendingUpIcon />, path: '/statistics' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminData');
    navigate('/login');
  };

  const handlePasswordDialogOpen = () => {
    setPasswordDialogOpen(true);
    setError('');
    handleMenuClose();
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: ''
    });
  };

  const handlePasswordChange = async () => {
    try {
      await axios.patch(
        'https://winstrikebackend.mixmall.uz/api/admin/password',
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      handlePasswordDialogClose();
      handleLogout();
    } catch (err) {
      setError('Parolni yangilashda xatolik yuz berdi');
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'white',
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Toolbar>
          <IconButton
            color="primary"
            onClick={() => setDrawerOpen(!drawerOpen)}
            edge="start"
            sx={{ mr: 2 }}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Admin Panel'}
          </Typography>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { minWidth: 200 }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" noWrap>
                {adminData.username || 'Admin'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Administrator
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handlePasswordDialogOpen} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Parolni o'zgartirish
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Chiqish
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? drawerWidth : theme.spacing(7),
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : theme.spacing(7),
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            borderRight: 'none',
            boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
            bgcolor: 'white'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'hidden', mt: 2 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 2,
                    borderRadius: '12px',
                    mb: 1,
                    cursor: 'pointer',
                    bgcolor: isActive ? 'primary.light' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.light' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isActive ? 'primary.main' : 'text.secondary',
                    minWidth: 40
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{
                      opacity: drawerOpen ? 1 : 0,
                      color: isActive ? 'primary.main' : 'text.primary'
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: `calc(100% - ${drawerOpen ? drawerWidth : theme.spacing(7)}px)`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          })
        }}
      >
        <Toolbar />
        {children}
      </Box>

      <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose}>
        <DialogTitle>Parolni yangilash</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Joriy parol"
            type="password"
            fullWidth
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Yangi parol"
            type="password"
            fullWidth
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose}>Bekor qilish</Button>
          <Button onClick={handlePasswordChange}>Saqlash</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
