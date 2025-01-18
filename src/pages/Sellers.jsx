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
  DialogContentText
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
    newPassword: ''
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
      const response = await axios.get('https://winstrikebackend.mixmall.uz/api/sellers', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSellers(response.data);
    } catch (err) {
      console.error('Sotuvchilarni yuklashda xatolik:', err);
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
        newPassword: ''
      });
    } else {
      setSelectedSeller(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        newPassword: ''
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
      newPassword: ''
    });
    setDialogTab(0);
  };

  const updateSellerInfo = async () => {
    await axios.patch(
      `https://winstrikebackend.mixmall.uz/api/sellers/${selectedSeller._id}`,
      {
        name: formData.name,
        username: formData.username
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
    }
    return true;
  };

  const updateSellerPassword = async () => {
    try {
      // Parolni tekshirish
      validatePassword(formData.newPassword);

      const response = await axios.patch(
        `https://winstrikebackend.mixmall.uz/api/sellers/${selectedSeller._id}/password`,
        {
          newPassword: formData.newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // WebSocket orqali xabar yuborish
      socket.emit('sellerPasswordUpdated', { 
        id: selectedSeller._id 
      });

      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error('Sotuvchi topilmadi');
      }
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSeller) {
        // Ma'lumotlarni yangilash
        await updateSellerInfo();

        // Agar yangi parol kiritilgan bo'lsa
        if (formData.newPassword) {
          try {
            await updateSellerPassword();
            setSnackbar({
              open: true,
              message: 'Sotuvchi paroli muvaffaqiyatli yangilandi',
              severity: 'success'
            });
          } catch (err) {
            setSnackbar({
              open: true,
              message: err.message || 'Parolni yangilashda xatolik yuz berdi',
              severity: 'error'
            });
            return;
          }
        }

        setSnackbar({
          open: true,
          message: 'Sotuvchi muvaffaqiyatli yangilandi',
          severity: 'success'
        });
      } else {
        // Yangi sotuvchi qo'shish
        if (formData.password) {
          validatePassword(formData.password);
        }

        await axios.post(
          'https://winstrikebackend.mixmall.uz/api/sellers',
          {
            name: formData.name,
            username: formData.username,
            password: formData.password
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        setSnackbar({
          open: true,
          message: 'Sotuvchi muvaffaqiyatli qo\'shildi',
          severity: 'success'
        });
      }

      // Sotuvchilar ro'yxatini yangilash
      fetchSellers();
      
      // Socket orqali xabar yuborish
      socket.emit(selectedSeller ? 'sellerUpdated' : 'sellerCreated', { 
        id: selectedSeller?._id 
      });
      
      // Modalni yopish
      handleClose();
      
    } catch (err) {
      console.error('Error:', err.response || err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Xatolik yuz berdi',
        severity: 'error'
      });
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
      await axios.delete(`https://winstrikebackend.mixmall.uz/api/sellers/${deleteDialog.seller._id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
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
                        label="Faol" 
                        size="small"
                        sx={{ 
                          bgcolor: 'success.light',
                          color: 'success.main',
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
            {selectedSeller ? (
              <TextField
                fullWidth
                label="Yangi parol"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                helperText="Parol kamida 6 ta belgidan iborat bo'lishi kerak"
                error={formData.newPassword ? formData.newPassword.length < 6 : false}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            ) : (
              <TextField
                fullWidth
                label="Parol"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required={!selectedSeller}
                helperText="Parol kamida 6 ta belgidan iborat bo'lishi kerak"
                error={formData.password ? formData.password.length < 6 : false}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
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
