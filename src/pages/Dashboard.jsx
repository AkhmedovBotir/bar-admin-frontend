import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Person as PersonIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import axios from 'axios';

const Dashboard = () => {
  const theme = useTheme();
  const [topProducts, setTopProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [warehouseStats, setWarehouseStats] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  const fetchStatistics = async (period) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://barback.mixmall.uz/api/statistics/${period}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        switch(period) {
          case 'daily':
            setDailyStats({
              ...data,
              productSalesHistory: data.productSalesHistory?.map(item => ({
                name: item.name || 'Noma\'lum',
                totalQuantity: item.totalQuantity || 0,
                totalAmount: item.totalAmount || 0
              })) || []
            });
            break;
          case 'weekly':
            setWeeklyStats({
              ...data,
              dailyStats: data.dailyStats?.map(item => ({
                date: new Date(item.date).toLocaleDateString('uz-UZ'),
                totalOrders: item.totalOrders || 0,
                totalAmount: item.totalAmount || 0
              })) || []
            });
            break;
          case 'monthly':
            setMonthlyStats({
              ...data,
              weeklyStats: data.weeklyStats?.map(item => ({
                week: `${item.week}-hafta`,
                totalOrders: item.totalOrders || 0,
                totalAmount: item.totalAmount || 0
              })) || []
            });
            break;
          case 'warehouse':
            setWarehouseStats({
              ...data,
              categoryStats: data.categoryStats?.map(item => ({
                categoryName: item.categoryName || 'Noma\'lum',
                totalQuantity: item.totalQuantity || 0,
                totalAmount: item.totalAmount || 0
              })) || []
            });
            break;
        }
      } else {
        setError('Ma\'lumotlarni olishda xatolik yuz berdi');
      }
    } catch (err) {
      console.error(`${period} statistikasini olishda xatolik:`, err);
      setError(err.response?.data?.message || 'Statistikani olishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Mahsulotlarni olish
      const productsResponse = await axios.get('https://barback.mixmall.uz/api/product', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: 5,
          orderBy: 'soldCount',
          order: 'desc'
        }
      });

      if (productsResponse.data.success) {
        const products = productsResponse.data.data.items || [];
        setTopProducts(products.map(product => ({
          ...product,
          soldCount: product.soldCount || 0,
          trend: Math.floor(Math.random() * 20) - 10, // Test uchun
          totalAmount: product.price * (product.soldCount || 0)
        })));
      }
    } catch (err) {
      console.error('Mahsulotlarni yuklashda xatolik:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Mahsulotlarni yuklashda xatolik',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopSellers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Sotuvchilar statistikasini olish
      const sellersResponse = await axios.get('https://barback.mixmall.uz/api/statistics/sellers', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: 5,
          orderBy: 'totalAmount',
          order: 'desc'
        }
      });

      if (sellersResponse.data.success) {
        // API javobini tekshirish va array'ga o'tkazish
        const sellersData = sellersResponse.data.data;
        const sellers = Array.isArray(sellersData) ? sellersData : 
                       sellersData?.items ? sellersData.items : [];
                       
        // Ma'lumotlarni formatlash
        setTopSellers(sellers.map(seller => ({
          _id: seller._id,
          name: seller.name || seller.username || 'Noma\'lum',
          username: seller.username || '',
          ordersCount: seller.ordersCount || 0,
          ordersTrend: seller.ordersTrend || 0,
          customersCount: seller.customersCount || 0,
          totalAmount: seller.totalAmount || 0
        })));
      }
    } catch (err) {
      console.error('Sotuvchilar statistikasini yuklashda xatolik:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Sotuvchilar statistikasini yuklashda xatolik',
        severity: 'error'
      });
      // Xatolik bo'lganda bo'sh array qo'yish
      setTopSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
    fetchTopSellers();
    fetchStatistics('daily');
    fetchStatistics('weekly');
    fetchStatistics('monthly');
    fetchStatistics('warehouse');
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Dashboard
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Eng ko'p sotilgan mahsulotlar */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3,
                  borderRadius: '12px',
                  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'warning.lighter',
                      color: 'warning.main',
                      mr: 2
                    }}
                  >
                    <InventoryIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Eng ko'p sotilgan mahsulotlar
                  </Typography>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Mahsulot</TableCell>
                          <TableCell>Kategoriya</TableCell>
                          <TableCell>Sotilgan</TableCell>
                          <TableCell align="right">Summa</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProducts.map((product) => (
                          <TableRow key={product._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={product.image}
                                  variant="rounded"
                                  sx={{ 
                                    mr: 2,
                                    width: 40,
                                    height: 40
                                  }}
                                >
                                  <InventoryIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {product.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {product.description}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={product.category?.name || '-'}
                                size="small"
                                sx={{ 
                                  bgcolor: 'warning.lighter',
                                  color: 'warning.main',
                                  fontWeight: 500
                                }} 
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500, mr: 1 }}>
                                  {product.soldCount}
                                </Typography>
                                <Tooltip title={`${product.trend}% ${product.trend > 0 ? 'ko\'proq' : 'kamroq'}`}>
                                  <IconButton 
                                    size="small"
                                    sx={{ 
                                      p: 0.5,
                                      bgcolor: product.trend > 0 ? 'success.lighter' : 'error.lighter',
                                      color: product.trend > 0 ? 'success.main' : 'error.main',
                                      '&:hover': {
                                        bgcolor: product.trend > 0 ? 'success.light' : 'error.light'
                                      }
                                    }}
                                  >
                                    {product.trend > 0 ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {formatPrice(product.totalAmount)} so'm
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        {topProducts.length === 0 && !loading && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body1" sx={{ py: 2, color: 'text.secondary' }}>
                                Ma'lumotlar topilmadi
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            {/* Eng yaxshi sotuvchilar */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3,
                  borderRadius: '12px',
                  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'success.lighter',
                      color: 'success.main',
                      mr: 2
                    }}
                  >
                    <EmojiEventsIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Eng yaxshi sotuvchilar
                  </Typography>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Sotuvchi</TableCell>
                          <TableCell>Buyurtmalar</TableCell>
                          <TableCell>Mijozlar</TableCell>
                          <TableCell align="right">Savdo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topSellers.map((seller) => (
                          <TableRow key={seller._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    mr: 2,
                                    bgcolor: theme.palette.primary.lighter,
                                    color: theme.palette.primary.main
                                  }}
                                >
                                  <PersonIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {seller.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {seller.username}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body1" sx={{ fontWeight: 500, mr: 1 }}>
                                  {seller.ordersCount}
                                </Typography>
                                <Tooltip title={`${seller.ordersTrend}% ${seller.ordersTrend > 0 ? 'ko\'proq' : 'kamroq'}`}>
                                  <IconButton 
                                    size="small"
                                    sx={{ 
                                      p: 0.5,
                                      bgcolor: seller.ordersTrend > 0 ? 'success.lighter' : 'error.lighter',
                                      color: seller.ordersTrend > 0 ? 'success.main' : 'error.main',
                                      '&:hover': {
                                        bgcolor: seller.ordersTrend > 0 ? 'success.light' : 'error.light'
                                      }
                                    }}
                                  >
                                    {seller.ordersTrend > 0 ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {seller.customersCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {formatPrice(seller.totalAmount)} so'm
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        {topSellers.length === 0 && !loading && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body1" sx={{ py: 2, color: 'text.secondary' }}>
                                Ma'lumotlar topilmadi
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Statistika Chartlari */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            {/* Kunlik Statistika */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Kunlik Statistika</Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <CircularProgress />
                  ) : error ? (
                    <Typography color="error">{error}</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyStats?.productSalesHistory || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalQuantity" name="Sotilgan soni" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="totalAmount" name="Summa" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Haftalik Statistika */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Haftalik Statistika</Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <CircularProgress />
                  ) : error ? (
                    <Typography color="error">{error}</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyStats?.dailyStats || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="totalOrders" name="Buyurtmalar" fill="#8884d8" />
                        <Bar dataKey="totalAmount" name="Summa" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Kategoriyalar bo'yicha */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Kategoriyalar bo'yicha</Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <CircularProgress />
                  ) : error ? (
                    <Typography color="error">{error}</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={warehouseStats?.categoryStats || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="totalQuantity"
                          nameKey="categoryName"
                        >
                          {(warehouseStats?.categoryStats || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Oylik Trend */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Oylik Trend</Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <CircularProgress />
                  ) : error ? (
                    <Typography color="error">{error}</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyStats?.weeklyStats || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="totalOrders" name="Buyurtmalar" fill="#8884d8" />
                        <Bar dataKey="totalAmount" name="Summa" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
