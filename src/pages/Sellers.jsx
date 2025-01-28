import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Tooltip,
  InputAdornment,
  useTheme,
  Tabs,
  Tab,
  Avatar,
  DialogContentText,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import axios from 'axios';
import socket from '../utils/socket';

const Sellers = () => {
  const theme = useTheme();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogTab, setDialogTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    newPassword: '',
    status: 'active',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    seller: null
  });

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const adminData = localStorage.getItem('adminData');
      
      // Debug: Token va admin ma'lumotlarini tekshirish
      console.log('Auth check:', {
        token: token ? token.substring(0, 20) + '...' : null,
        adminData: adminData ? JSON.parse(adminData) : null
      });

      if (!token || !adminData) {
        throw new Error('Token yoki admin ma\'lumotlari topilmadi');
      }

      // API so'rovi
      console.log('Sending request to:', 'https://barback.mixmall.uz/api/seller');
      console.log('With headers:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });

      const response = await axios.get('https://barback.mixmall.uz/api/seller', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Debug: API javobini tekshirish
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (response.data) {
        setSellers(response.data);
      }
    } catch (err) {
      // Debug: Xatolikni batafsil ko'rish
      console.error('Sotuvchilarni yuklashda xatolik:', {
        message: err.message,
        response: {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers
        },
        request: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Sotuvchilarni yuklashda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();

    socket.on('sellerCreated', () => {
      fetchSellers();
    });

    return () => {
      socket.off('sellerCreated');
    };
  }, []);

  const handleOpen = (seller = null) => {
    if (seller) {
      setSelectedSeller(seller);
      setFormData({
        name: seller.name,
        username: seller.username,
        password: '',
        newPassword: '',
        status: seller.status || 'active',
        phone: seller.phone
      });
    } else {
      setSelectedSeller(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        newPassword: '',
        status: 'active',
        phone: ''
      });
    }
    setDialogTab(0);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSeller(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      newPassword: '',
      status: 'active',
      phone: ''
    });
    setDialogTab(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      if (selectedSeller) {
        if (dialogTab === 0) {
          // Asosiy ma'lumotlarni yangilash
          const response = await axios.patch(
            `https://barback.mixmall.uz/api/seller/${selectedSeller._id}`,
            {
              name: formData.name,
              username: formData.username,
              phone: formData.phone
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (response.data.success) {
            setSnackbar({
              open: true,
              message: 'Sotuvchi ma\'lumotlari yangilandi',
              severity: 'success'
            });
            handleClose();
            fetchSellers();
          }
        } else {
          // Parolni yangilash
          if (formData.newPassword) {
            validatePassword(formData.newPassword);
            const response = await axios.patch(
              `https://barback.mixmall.uz/api/seller/${selectedSeller._id}`,
              {
                password: formData.newPassword
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );

            if (response.data.success) {
              setSnackbar({
                open: true,
                message: 'Parol yangilandi',
                severity: 'success'
              });
              handleClose();
            }
          }
        }
      } else {
        // Yangi sotuvchi qo'shish
        validatePassword(formData.password);
        
        const response = await axios.post(
          'https://barback.mixmall.uz/api/seller',
          {
            name: formData.name,
            username: formData.username,
            password: formData.password,
            phone: formData.phone
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setSnackbar({
            open: true,
            message: 'Yangi sotuvchi qo\'shildi',
            severity: 'success'
          });
          handleClose();
          fetchSellers();
        }
      }
    } catch (err) {
      console.error('Sotuvchi qo\'shishda xatolik:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Sotuvchi qo\'shishda xatolik yuz berdi';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('adminData');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    if (!password || password.length < 6) {
      throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
    }
  };

  const handleDeleteClick = (seller) => {
    setDeleteDialog({
      open: true,
      seller
    });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      open: false,
      seller: null
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`https://barback.mixmall.uz/api/seller/${deleteDialog.seller._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSnackbar({
        open: true,
        message: 'Sotuvchi muvaffaqiyatli o\'chirildi',
        severity: 'success'
      });
      
      // Sotuvchilar ro'yxatini yangilash
      fetchSellers();
      
      // Socket orqali xabar yuborish
      socket.emit('sellerDeleted', { id: deleteDialog.seller._id });
      
      // Modalni yopish
      handleDeleteCancel();
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Sotuvchini o\'chirishda xatolik yuz berdi',
        severity: 'error'
      });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setDialogTab(newValue);
  };

  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Box>
      <Paper 
        sx={{ 
          p: 3,
          mb: 3,
          borderRadius: '12px',
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Sotuvchilar
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              px: 3
            }}
          >
            Yangi sotuvchi
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: '8px' }
          }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sotuvchi</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSellers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((seller) => (
                  <TableRow key={seller._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        
                        <Typography variant="body1">
                          {seller.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{seller.username}</TableCell>
                    <TableCell>
                      <Chip 
                        label={seller.status === 'active' ? 'Faol' : 'Nofaol'} 
                        size="small"
                        sx={{ 
                          bgcolor: seller.status === 'active' ? 'success.light' : 'error.light',
                          color: seller.status === 'active' ? 'success.main' : 'error.main',
                          fontWeight: 500
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Tahrirlash">
                        <IconButton 
                          onClick={() => handleOpen(seller)}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.lighter' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="O'chirish">
                        <IconButton 
                          color="error"
                          onClick={() => handleDeleteClick(seller)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredSellers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Qatorlar soni:"
        />
      </Paper>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                mr: 2
              }}
            >
              {selectedSeller ? <EditIcon /> : <AddIcon />}
            </Avatar>
            <Typography variant="h6">
              {selectedSeller ? 'Sotuvchini tahrirlash' : 'Yangi sotuvchi'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 2 }}
          >
            <Box sx={{ width: '100%', mt: 2 }}>
              <Tabs value={dialogTab} onChange={(e, newValue) => setDialogTab(newValue)}>
                <Tab label="Asosiy ma'lumotlar" />
                {selectedSeller && <Tab label="Parolni o'zgartirish" />}
              </Tabs>
            </Box>

            {dialogTab === 0 && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Ism"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Telefon"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                {!selectedSeller && (
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Parol"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
                {selectedSeller && (
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="active">Faol</MenuItem>
                    <MenuItem value="inactive">Nofaol</MenuItem>
                  </TextField>
                )}
              </Box>
            )}
            {dialogTab === 1 && selectedSeller && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  label="Yangi parol"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  helperText="Parol kamida 6 ta belgidan iborat bo'lishi kerak"
                  error={formData.newPassword ? formData.newPassword.length < 6 : false}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={handleClose}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            {selectedSeller ? 'Saqlash' : 'Qo\'shish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* O'chirish modali */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'error.lighter',
                color: 'error.main',
                mr: 2
              }}
            >
              <DeleteIcon />
            </Avatar>
            <Typography variant="h6">
              Sotuvchini o'chirish
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Rostdan ham {deleteDialog.seller?.name} ni o'chirmoqchimisiz?
            <br />
            Bu amalni ortga qaytarib bo'lmaydi.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sellers;
