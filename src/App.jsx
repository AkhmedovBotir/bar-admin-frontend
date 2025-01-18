import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Sellers from './pages/Sellers';
import Statistics from './pages/Statistics';
import { Snackbar, Alert } from '@mui/material';
import { io } from 'socket.io-client';

function App() {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const socket = useMemo(() => io('https://winstrikebackend.mixmall.uz', {
    transports: ['polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      token: () => localStorage.getItem('token')
    }
  }), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      socket.auth = { token };
      socket.connect();
    }

    // Sotuvchi eventlari
    socket.on('seller_login', ({ name }) => {
      setSnackbar({
        open: true,
        message: `Sotuvchi ${name} tizimga kirdi`,
        severity: 'info'
      });
    });

    socket.on('seller_logout', ({ name }) => {
      setSnackbar({
        open: true,
        message: `Sotuvchi ${name} tizimdan chiqdi`,
        severity: 'info'
      });
    });

    socket.on('seller_created', (seller) => {
      setSnackbar({
        open: true,
        message: `Yangi sotuvchi qo'shildi: ${seller.name}`,
        severity: 'success'
      });
    });

    socket.on('seller_updated', ({ sellerId, changes }) => {
      setSnackbar({
        open: true,
        message: `Sotuvchi ma'lumotlari yangilandi`,
        severity: 'success'
      });
    });

    socket.on('seller_deleted', ({ sellerId }) => {
      setSnackbar({
        open: true,
        message: `Sotuvchi o'chirildi`,
        severity: 'info'
      });
    });

    // Admin eventlari
    socket.on('admin_login', () => {
      setSnackbar({
        open: true,
        message: 'Admin tizimga kirdi',
        severity: 'info'
      });
    });

    socket.on('admin_logout', () => {
      setSnackbar({
        open: true,
        message: 'Admin tizimdan chiqdi',
        severity: 'info'
      });
    });

    // Xatolik eventlari
    socket.on('connect_error', () => {
      setSnackbar({
        open: true,
        message: 'Server bilan aloqa uzildi',
        severity: 'error'
      });
    });

    socket.on('error', (error) => {
      setSnackbar({
        open: true,
        message: 'WebSocket xatosi yuz berdi',
        severity: 'error'
      });
    });

    // Tozalash
    return () => {
      socket.off('seller_login');
      socket.off('seller_logout');
      socket.off('seller_created');
      socket.off('seller_updated');
      socket.off('seller_deleted');
      socket.off('admin_login');
      socket.off('admin_logout');
      socket.off('connect_error');
      socket.off('error');
      socket.disconnect();
    };
  }, [socket]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return <Navigate to="/login" />;
    }
    return <Layout>{children}</Layout>;
  };

  return (
    <div>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/sellers"
            element={
              <PrivateRoute>
                <Sellers />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PrivateRoute>
                <Statistics />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
