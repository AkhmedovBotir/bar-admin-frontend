import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TablePagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { formatPrice } from '../utils/format';

const API_URL = 'http://localhost:5000';

const Orders = () => {
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/order-history/completed-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownloadReceipt = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      // TODO: Implement receipt download
      console.log('Downloading receipt for order:', orderId);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return {
          color: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)'
        };
      case 'pending':
        return {
          color: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)'
        };
      case 'cancelled':
        return {
          color: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)'
        };
      default:
        return {
          color: '#9e9e9e',
          backgroundColor: 'rgba(158, 158, 158, 0.1)'
        };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Bajarildi';
      case 'pending':
        return 'Kutilmoqda';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return status;
    }
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(63, 81, 181, 0.1)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
            <Typography variant="h6" color="#3f51b5" fontWeight="bold">
              Buyurtmalar
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                    Buyurtma ID
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                    Sana
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                    Mahsulotlar
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                    Summa
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                    Chek
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.orders?.map((order) => (
                  <TableRow
                    key={order._id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(63, 81, 181, 0.04)',
                        '& .MuiTableCell-root': {
                          color: '#3f51b5'
                        }
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <TableCell sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'rgba(63, 81, 181, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <ReceiptIcon sx={{ color: '#3f51b5' }} />
                        </Box>
                        <Typography>#{order.orderId}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      {new Date(order.createdAt).toLocaleString('uz-UZ')}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {order.products.map((product, index) => (
                          <Typography key={index} variant="body2">
                            {product.name} x {product.quantity} ({product.unitSize} {product.unit})
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      <Chip
                        label={getStatusText(order.status)}
                        sx={{
                          ...getStatusColor(order.status),
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      {formatPrice(order.totalSum)}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Ko'rish">
                          <IconButton
                            onClick={() => handleOpenModal(order)}
                            sx={{
                              color: '#3f51b5',
                              '&:hover': {
                                backgroundColor: 'rgba(63, 81, 181, 0.04)'
                              }
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chek">
                          <IconButton
                            onClick={() => handleDownloadReceipt(order._id)}
                            sx={{
                              color: '#3f51b5',
                              '&:hover': {
                                backgroundColor: 'rgba(63, 81, 181, 0.04)'
                              }
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={orders.pagination?.total || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Qatorlar soni:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} dan ${count}`
            }
          />
        </Paper>
      </Box>

      {/* Order Details Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ bgcolor: '#f5f5f5', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'rgba(63, 81, 181, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ReceiptIcon sx={{ color: '#3f51b5' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                    Buyurtma #{selectedOrder.orderId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(selectedOrder.createdAt).toLocaleString('uz-UZ')}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#3f51b5', mb: 1 }}>
                      Buyurtma holati
                    </Typography>
                    <Chip
                      label={getStatusText(selectedOrder.status)}
                      sx={{
                        ...getStatusColor(selectedOrder.status),
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#3f51b5', mb: 2 }}>
                    Mahsulotlar
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Nomi</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Miqdori</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Narxi</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Jami</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.products.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {product.unitSize} {product.unit}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">{product.quantity}</TableCell>
                            <TableCell align="center">{formatPrice(product.price)}</TableCell>
                            <TableCell align="right">{formatPrice(product.price * product.quantity)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Jami summa</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatPrice(selectedOrder.totalSum)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                        To'lov turi
                      </Typography>
                      <Chip
                        label={selectedOrder.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
                        sx={{
                          bgcolor: 'rgba(63, 81, 181, 0.1)',
                          color: '#3f51b5',
                          fontWeight: 'bold',
                          mt: 1
                        }}
                      />
                    </Box>
                    {selectedOrder.computerNumber && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#3f51b5', textAlign: 'right' }}>
                          Kompyuter
                        </Typography>
                        <Chip
                          label={`№${selectedOrder.computerNumber}`}
                          sx={{
                            bgcolor: 'rgba(63, 81, 181, 0.1)',
                            color: '#3f51b5',
                            fontWeight: 'bold',
                            mt: 1
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>

                
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <IconButton
                onClick={handleCloseModal}
                sx={{
                  color: '#3f51b5',
                  '&:hover': {
                    backgroundColor: 'rgba(63, 81, 181, 0.04)'
                  }
                }}
              >
                <VisibilityIcon />
              </IconButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>

  );
};

export default Orders;
