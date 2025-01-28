import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
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
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axiosInstance from '../utils/axios';
import { formatPrice } from '../utils/format';

const API_URL = 'https://barback.mixmall.uz';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState({});
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, tabValue]);

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/api/order-history/completed-orders`);

      if (response.data.success) {
        console.log('Barcha buyurtmalar:', response.data.data);
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!orders.orders) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = [];
    
    switch (tabValue) {
      case 0: // Kunlik
        filtered = orders.orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today;
        });
        console.log('Kunlik buyurtmalar:', filtered);
        break;
      
      case 1: // Haftalik
        filtered = orders.orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= thisWeekStart;
        });
        console.log('Haftalik buyurtmalar:', filtered);
        break;
      
      case 2: // Oylik
        filtered = orders.orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= thisMonthStart;
        });
        console.log('Oylik buyurtmalar:', filtered);
        break;
      
      default: // Hammasi
        filtered = orders.orders;
        console.log('Barcha buyurtmalar:', filtered);
    }

    setFilteredOrders(filtered);
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePrint = (order) => {
    try {
      // PDF yaratish
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150],
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      // Shriftlarni qo'shish
      doc.addFont('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', 'Roboto', 'normal');
      doc.addFont('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', 'Roboto', 'bold');

      // Sarlavha
      doc.setFontSize(14);
      doc.setFont('Roboto', 'bold');
      doc.text('WINSTRIKE', 40, 10, { align: 'center' });
      
      // Chek ma'lumotlari
      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');
      
      // Sana va vaqtni formatlash
      const date = new Date(order.createdAt).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Asosiy ma'lumotlar
      doc.text(`Чек №${order.orderId || 'N/A'}`, 5, 20);
      doc.text(`Дата: ${date}`, 5, 25);
      doc.text(`Компьютер: ${order.table || 'N/A'}`, 5, 30);

      // Ajratuvchi chiziq
      doc.line(5, 40, 75, 40);

      // Mahsulotlar jadvali sarlavhasi
      doc.setFont('Roboto', 'bold');
      doc.text('Наименование', 5, 45);
      doc.text('Кол-во', 45, 45);
      doc.text('Сумма', 60, 45);
      doc.setFont('Roboto', 'normal');

      // Mahsulotlar ro'yxati
      let y = 52;
      
      if (Array.isArray(order.products)) {
        order.products.forEach((item) => {
          const { name, quantity, price, unitSize, unit } = item;
          const total = quantity * price;
          const unitText = unitSize ? ` ${unitSize}${unit}` : '';

          doc.text(`${name}${unitText}`, 5, y);
          doc.text(`${quantity}`, 47, y);
          doc.text(`${total.toLocaleString()}`, 60, y);
          
          y += 5;
        });
      }

      // Pastki chiziq
      doc.line(5, y + 2, 75, y + 2);

      // Jami summa
      doc.setFont('Roboto', 'bold');
      doc.text('ИТОГО:', 5, y + 7);
      doc.text(`${order.totalSum.toLocaleString()} сум`, 45, y + 7);

      // To'lov holati
      const statusText = order.status === 'completed' ? 'ОПЛАЧЕНО' : order.status.toUpperCase();
      doc.text(statusText, 40, y + 12, { align: 'center' });

      // Footer
      y += 20;
      doc.setFontSize(8);
      doc.setFont('Roboto', 'normal');
      doc.text('Спасибо за покупку!', 40, y, { align: 'center' });
      doc.text('WINSTRIKE', 40, y + 3, { align: 'center' });

      // PDF ni yuklab olish
      doc.save(`check-${order.orderId || order._id}.pdf`);
      
      toast.success('Чек успешно создан');
      
    } catch (error) {
      console.error('PDF yaratishda xatolik:', error);
      toast.error('Ошибка при создании чека');
    }
  };

  const handleDownloadReceipt = (order) => {
    try {
      handlePrint(order);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Ошибка при скачивании чека');
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

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2, mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="orders tabs">
            <Tab label="Kunlik" />
            <Tab label="Haftalik" />
            <Tab label="Oylik" />
            <Tab label="Hammasi" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={tabValue}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                  {filteredOrders
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((order) => (
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
                              onClick={() => handleDownloadReceipt(order)}
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
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>
      </Paper>

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
    </Box>
  );
};

export default Orders;