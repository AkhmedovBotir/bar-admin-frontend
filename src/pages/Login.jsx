import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://winstrikebackend.mixmall.uz/api/admin/login', {
        username,
        password
      });
      
      const token = response.data.token;
      localStorage.setItem('token', token);

      // Admin profilini olish
      const profileResponse = await axios.get('https://winstrikebackend.mixmall.uz/api/admin/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      localStorage.setItem('adminData', JSON.stringify(profileResponse.data));
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Login yoki parol noto\'g\'ri');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Serverga ulanishda xatolik yuz berdi');
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Admin Panel
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Kirish
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
