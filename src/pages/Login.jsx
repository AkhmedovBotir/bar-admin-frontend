import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Request body ni log qilish
      console.log('Login request body:', { username, password });
      
      // Login so'rovini yuborish
      const response = await axios.post('https://barback.mixmall.uz/api/admin/login', {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // To'liq response ni log qilish
      console.log('Full login response:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
      
      if (response.data.success) {
        const { token, admin } = response.data.data;
        
        // Token va admin ma'lumotlarini tekshirish
        console.log('Token structure:', {
          raw: token,
          length: token?.length,
          startsWithBearer: token?.startsWith('Bearer ')
        });
        
        console.log('Admin data:', admin);
        
        if (!token) {
          throw new Error('Token topilmadi');
        }
        
        if (!admin) {
          throw new Error('Admin ma\'lumotlari topilmadi');
        }
        
        // Token ni tozalash va saqlash
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        localStorage.setItem('token', cleanToken);
        localStorage.setItem('adminData', JSON.stringify(admin));
        
        // Saqlangan ma'lumotlarni tekshirish
        console.log('Saved data:', {
          token: localStorage.getItem('token'),
          adminData: localStorage.getItem('adminData')
        });
        
        navigate('/');
      } else {
        setError('Login yoki parol noto\'g\'ri');
      }
    } catch (err) {
      // Xatolikni to'liq log qilish
      console.error('Login error:', {
        message: err.message,
        response: {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers
        },
        request: {
          headers: err.config?.headers,
          url: err.config?.url,
          method: err.config?.method
        }
      });
      
      if (err.response?.status === 401) {
        setError('Login yoki parol noto\'g\'ri');
      } else if (err.message.includes('Token') || err.message.includes('Admin')) {
        setError(err.message);
      } else {
        setError('Serverga ulanishda xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
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
              label="Login"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Parol"
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
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Kirish'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
