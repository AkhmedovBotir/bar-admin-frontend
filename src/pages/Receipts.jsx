import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Collapse
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axios from 'axios';
import socket from '../utils/socket';

const Row = ({ receipt }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{receipt._id}</TableCell>
        <TableCell>{receipt.seller?.name}</TableCell>
        <TableCell>{receipt.totalAmount}</TableCell>
        <TableCell>{receipt.paymentMethod}</TableCell>
        <TableCell>{new Date(receipt.createdAt).toLocaleString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Mahsulotlar
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nomi</TableCell>
                    <TableCell>Miqdori</TableCell>
                    <TableCell>Narxi</TableCell>
                    <TableCell>Jami</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipt.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product?.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.product?.price}</TableCell>
                      <TableCell>{item.quantity * item.product?.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const [newReceipt, setNewReceipt] = useState({
    items: [{ product: '', quantity: '' }],
    paymentMethod: 'cash'
  });

  const fetchReceipts = async () => {
    try {
      const response = await axios.get('https://barback.mixmall.uz/api/receipts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setReceipts(response.data);
    } catch (err) {
      console.error('Cheklarni yuklashda xatolik:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://barback.mixmall.uz/api/products', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Mahsulotlarni yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchProducts();

    // Socket event listeners
    socket.on('newReceipt', (receipt) => {
      setReceipts(prev => [receipt, ...prev]);
    });

    // Cleanup
    return () => {
      socket.off('newReceipt');
    };
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setNewReceipt({
      items: [{ product: '', quantity: '' }],
      paymentMethod: 'cash'
    });
  };

  const handleAddItem = () => {
    setNewReceipt({
      ...newReceipt,
      items: [...newReceipt.items, { product: '', quantity: '' }]
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newReceipt.items];
    updatedItems[index][field] = value;
    setNewReceipt({
      ...newReceipt,
      items: updatedItems
    });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('https://barback.mixmall.uz/api/receipts', newReceipt, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      handleClose();
      fetchReceipts();
    } catch (err) {
      setError('Chek yaratishda xatolik yuz berdi');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Cheklar</Typography>
        <Button variant="contained" onClick={handleClickOpen}>
          Yangi chek
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>ID</TableCell>
              <TableCell>Sotuvchi</TableCell>
              <TableCell>Jami summa</TableCell>
              <TableCell>To'lov turi</TableCell>
              <TableCell>Sana</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receipts.map((receipt) => (
              <Row key={receipt._id} receipt={receipt} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Yangi chek yaratish dialogi */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Yangi chek yaratish</DialogTitle>
        <DialogContent>
          {newReceipt.items.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Mahsulot</InputLabel>
                <Select
                  value={item.product}
                  label="Mahsulot"
                  onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                >
                  {products.map((product) => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="number"
                label="Miqdor"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              />
            </Box>
          ))}
          <Button onClick={handleAddItem}>Mahsulot qo'shish</Button>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>To'lov turi</InputLabel>
            <Select
              value={newReceipt.paymentMethod}
              label="To'lov turi"
              onChange={(e) => setNewReceipt({ ...newReceipt, paymentMethod: e.target.value })}
            >
              <MenuItem value="cash">Naqd</MenuItem>
              <MenuItem value="card">Karta</MenuItem>
            </Select>
          </FormControl>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Bekor qilish</Button>
          <Button onClick={handleSubmit}>Yaratish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receipts;
