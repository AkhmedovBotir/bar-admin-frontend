import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Card, Grid, Typography, Box, Paper, CircularProgress, TableContainer, Table, TableHead, TableBody, TableCell, TableRow, Chip, Avatar, Tooltip, Dialog, DialogTitle, DialogContent, IconButton, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/axios';
import axios from 'axios';
import { formatPrice } from '../utils/format';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningIcon from '@mui/icons-material/Warning';
import CategoryIcon from '@mui/icons-material/Category';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

const Statistics = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [warehouseStats, setWarehouseStats] = useState(null);
  const [products, setProducts] = useState([]); 
  const [sellersStats, setSellersStats] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerOrders, setSellerOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const fetchStatistics = async (period) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/statistics/${period}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        switch(period) {
          case 'daily':
            setDailyStats(response.data.data);
            break;
          case 'weekly':
            setWeeklyStats(response.data.data);
            break;
          case 'monthly':
            setMonthlyStats(response.data.data);
            break;
          case 'warehouse':
            setWarehouseStats(response.data.data);
            break;
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Statistikani olishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/product', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const productsData = response.data.data.items || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); 
    }
  };

  const fetchSellersStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('API so\'rov URL:', `https://barback.mixmall.uz/api/statistics/sellers?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await axios.get(
        `https://barback.mixmall.uz/api/statistics/sellers?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('API javobi:', response.data);
      
      if (response.data.success) {
        console.log('Sotuvchilar statistikasi:', response.data.data);
        setSellersStats(response.data.data);
      } else {
        console.error('API xatolik:', response.data);
        setError('Ma\'lumotlarni olishda xatolik yuz berdi');
      }
    } catch (err) {
      console.error('API so\'rov xatoligi:', err);
      console.error('Xatolik tafsilotlari:', err.response?.data);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerOrders = async (sellerId) => {
    setLoadingOrders(true);
    try {
      const response = await api.get(`/api/orders?sellerId=${sellerId}`);
      if (response.data.success) {
        setSellerOrders(response.data.data);
      }
    } catch (err) {
      console.error('Buyurtmalarni olishda xatolik:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getCurrentStats = () => {
    switch(tabValue) {
      case 0:
        return dailyStats;
      case 1:
        return weeklyStats;
      case 2:
        return monthlyStats;
      case 3:
        return warehouseStats;
      default:
        return null;
    }
  };

  const getTimeData = () => {
    const stats = getCurrentStats();
    if (!stats) return [];

    switch(tabValue) {
      case 0: 
        const dailyTotalProducts = stats.productSalesHistory.reduce((total, product) => {
          return total + product.totalQuantity;
        }, 0);

        return [{
          name: 'Bugun',
          "Sotilgan mahsulotlar": dailyTotalProducts,
          "Summa": stats.totalAmount
        }];

      case 1: 
        return stats.dailyStats.map(day => {
          const totalProducts = stats.productSalesHistory.reduce((total, product) => {
            const dayStats = product.dailyStats.find(d => d.date === day.date);
            return total + (dayStats ? dayStats.quantity : 0);
          }, 0);

          return {
            name: new Date(day.date).toLocaleDateString('uz-UZ', { weekday: 'short' }),
            "Sotilgan mahsulotlar": totalProducts,
            "Summa": day.totalAmount
          };
        });

      case 2: 
        return stats.weeklyStats.map(stat => ({
          name: `${stat.week}-hafta`,
          "Sotilgan mahsulotlar": stat.totalOrders,
          "Summa": stat.totalAmount
        }));

      case 3: 
        return stats.productSalesHistory.map(product => ({
          name: product.name,
          "Sotilgan mahsulotlar": product.totalQuantity,
          "Summa": product.totalAmount
        }));

      default:
        return [];
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSellerClick = (seller) => {
    console.log('Tanlangan sotuvchi:', seller);
    setSelectedSeller(seller);
    fetchSellerOrders(seller.sellerId);
  };

  const currentStats = getCurrentStats();

  const renderOverviewCards = (stats) => {
    if (!stats?.overview) return null;
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              border: '1px solid rgba(26, 35, 126, 0.1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(26, 35, 126, 0.15)',
                borderColor: 'rgba(26, 35, 126, 0.3)',
                '&::before': {
                  height: '6px'
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                bgcolor: '#1a237e',
                opacity: 0.7,
                transition: 'height 0.2s ease-in-out'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Jami Buyurtmalar
              </Typography>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(26, 35, 126, 0.1)',
                  border: '2px solid rgba(26, 35, 126, 0.2)'
                }}
              >
                <ShoppingBagIcon sx={{ color: '#1a237e' }} />
              </Box>
            </Box>
            <Typography variant="h4" color="#1a237e" fontWeight="bold">
              {stats.overview.totalOrders || stats.overview.totalProducts || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              border: '1px solid rgba(76, 175, 80, 0.1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(76, 175, 80, 0.15)',
                borderColor: 'rgba(76, 175, 80, 0.3)',
                '&::before': {
                  height: '6px'
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                bgcolor: '#4caf50',
                opacity: 0.7,
                transition: 'height 0.2s ease-in-out'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Jami Summa
              </Typography>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  border: '2px solid rgba(76, 175, 80, 0.2)'
                }}
              >
                <MonetizationOnIcon sx={{ color: '#4caf50' }} />
              </Box>
            </Box>
            <Typography variant="h4" color="#4caf50" fontWeight="bold">
              {formatPrice(stats.overview.totalAmount || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              border: '1px solid rgba(255, 152, 0, 0.1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(255, 152, 0, 0.15)',
                borderColor: 'rgba(255, 152, 0, 0.3)',
                '&::before': {
                  height: '6px'
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                bgcolor: '#ff9800',
                opacity: 0.7,
                transition: 'height 0.2s ease-in-out'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                O'rtacha Buyurtma
              </Typography>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 152, 0, 0.1)',
                  border: '2px solid rgba(255, 152, 0, 0.2)'
                }}
              >
                <TrendingUpIcon sx={{ color: '#ff9800' }} />
              </Box>
            </Box>
            <Typography variant="h4" color="#ff9800" fontWeight="bold">
              {formatPrice(
                stats.overview.totalOrders 
                  ? Math.round(stats.overview.totalAmount / stats.overview.totalOrders) 
                  : 0
              )}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const getProductQuantity = (productId) => {
    if (!Array.isArray(products)) return 0;
    const product = products.find(p => p._id === productId);
    return product ? product.inventory : 0;
  };

  useEffect(() => {
    const periods = ['daily', 'weekly', 'monthly', 'warehouse'];
    const currentPeriod = periods[tabValue];
    if (tabValue < 4) {
      fetchStatistics(currentPeriod);
    } else if (tabValue === 4) {
      fetchSellersStatistics();
    }
    fetchProducts(); 
  }, [tabValue, dateRange]);

  useEffect(() => {
    if (selectedSeller?.allProducts) {
      const filtered = selectedSeller.allProducts
        .filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          let comparison = 0;
          switch (sortField) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'quantity':
              comparison = a.quantity - b.quantity;
              break;
            case 'price':
              comparison = a.price - b.price;
              break;
            case 'total':
              comparison = a.totalAmount - b.totalAmount;
              break;
            default:
              comparison = 0;
          }
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      setFilteredProducts(filtered);
    }
  }, [selectedSeller, searchQuery, sortField, sortOrder]);

  return (
    <>
    <Box sx={{ width: '100%', borderRadius: 2, boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
          Statistika
        </Typography>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            mb: 3,
            '& .MuiTabs-indicator': {
              backgroundColor: '#1a237e',
            },
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 'medium',
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#1a237e',
              },
            },
          }}
        >
          <Tab label="Kunlik" />
          <Tab label="Haftalik" />
          <Tab label="Oylik" />
          <Tab label="Ombor" />
          <Tab label="Sotuvchilar" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress sx={{ color: '#1a237e' }} />
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {renderOverviewCards(dailyStats)}
              {dailyStats && (
                <Paper elevation={0} sx={{ pb: 3, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
                    Kunlik statistika
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getTimeData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3f51b5" />
                      <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Sotilgan mahsulotlar" fill="#3f51b5" />
                      <Bar yAxisId="right" dataKey="Summa" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              )}

              {dailyStats?.productSalesHistory && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 3,
                    border: '1px solid rgba(63, 81, 181, 0.1)',
                    overflow: 'hidden',
                    bgcolor: 'white'
                  }}
                >
                  <Box sx={{ p: 3, borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                    <Typography variant="h6" color="#3f51b5" fontWeight="bold">
                      Mahsulotlar sotilishi
                    </Typography>
                  </Box>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell 
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Nomi
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Sotilgan soni
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Qoldiq
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Jami summa
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dailyStats.productSalesHistory.map((product) => {
                          const remainingQuantity = getProductQuantity(product._id);
                          return (
                            <TableRow 
                              key={product._id}
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
                              <TableCell 
                                component="th" 
                                scope="row"
                                sx={{ 
                                  borderBottom: '1px solid rgba(63, 81, 181, 0.1)',
                                  py: 2
                                }}
                              >
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
                                    <Inventory2Icon sx={{ color: '#3f51b5' }} />
                                  </Box>
                                  <Typography>{product.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}
                              >
                                {product.totalQuantity}
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{ 
                                  borderBottom: '1px solid rgba(63, 81, 181, 0.1)',
                                  color: remainingQuantity < 10 ? '#f44336' : 'inherit'
                                }}
                              >
                                {remainingQuantity}
                              </TableCell>
                              <TableCell 
                                align="right"
                                sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}
                              >
                                {formatPrice(product.totalAmount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {renderOverviewCards(weeklyStats)}
              {weeklyStats && (
                <Paper elevation={0} sx={{ pb: 3, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
                    Kunlik statistika
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getTimeData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3f51b5" />
                      <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Sotilgan mahsulotlar" fill="#3f51b5" />
                      <Bar yAxisId="right" dataKey="Summa" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              )}

              {weeklyStats?.productSalesHistory && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 3,
                    border: '1px solid rgba(63, 81, 181, 0.1)',
                    overflow: 'hidden',
                    bgcolor: 'white'
                  }}
                >
                  <Box sx={{ p: 3, borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                    <Typography variant="h6" color="#3f51b5" fontWeight="bold">
                      Mahsulotlar sotilishi
                    </Typography>
                  </Box>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell 
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Nomi
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Sotilgan soni
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Qoldiq
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Jami summa
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weeklyStats.productSalesHistory.map((product) => {
                          const remainingQuantity = getProductQuantity(product._id);
                          return (
                            <TableRow 
                              key={product._id}
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
                              <TableCell 
                                component="th" 
                                scope="row"
                                sx={{ 
                                  borderBottom: '1px solid rgba(63, 81, 181, 0.1)',
                                  py: 2
                                }}
                              >
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
                                    <Inventory2Icon sx={{ color: '#3f51b5' }} />
                                  </Box>
                                  <Typography>{product.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}
                              >
                                {product.totalQuantity}
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{ 
                                  borderBottom: '1px solid rgba(63, 81, 181, 0.1)',
                                  color: remainingQuantity < 10 ? '#f44336' : 'inherit'
                                }}
                              >
                                {remainingQuantity}
                              </TableCell>
                              <TableCell 
                                align="right"
                                sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}
                              >
                                {formatPrice(product.totalAmount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {renderOverviewCards(monthlyStats)}
              {monthlyStats && (
                <Paper elevation={0} sx={{ pb: 3, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
                    Oylik statistika
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getTimeData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3f51b5" />
                      <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Sotilgan mahsulotlar" fill="#3f51b5" />
                      <Bar yAxisId="right" dataKey="Summa" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              )}

              {monthlyStats?.productSalesHistory && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 3,
                    border: '1px solid rgba(63, 81, 181, 0.1)',
                    overflow: 'hidden',
                    bgcolor: 'white'
                  }}
                >
                  <Box sx={{ p: 3, borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                    <Typography variant="h6" color="#3f51b5" fontWeight="bold">
                      Mahsulotlar sotilishi
                    </Typography>
                  </Box>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell 
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Nomi
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Sotilgan soni
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Qoldiq
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#3f51b5',
                              fontWeight: 'bold'
                            }}
                          >
                            Jami summa
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {monthlyStats.productSalesHistory.map((product) => {
                          const remainingQuantity = getProductQuantity(product._id);
                          return (
                            <TableRow 
                              key={product._id}
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
                              <TableCell 
                                component="th" 
                                scope="row"
                                sx={{ 
                                  borderBottom: '1px solid rgba(63, 81, 181, 0.1)',
                                  py: 2
                                }}
                              >
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
                                    <Inventory2Icon sx={{ color: '#3f51b5' }} />
                                  </Box>
                                  <Typography>{product.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}
                              >
                                {product.totalQuantity}
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{ 
                                  borderBottom: '1px solid rgba(63, 81, 181, 0.1)',
                                  color: remainingQuantity < 10 ? '#f44336' : 'inherit'
                                }}
                              >
                                {remainingQuantity}
                              </TableCell>
                              <TableCell 
                                align="right"
                                sx={{ borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}
                              >
                                {formatPrice(product.totalAmount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {warehouseStats && (
                <>
                  {/* Overview Cards */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: 'white',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Typography color="text.secondary">Jami mahsulotlar</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                          {warehouseStats.overview.totalProducts}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: 'white',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Typography color="text.secondary">Jami miqdor</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                          {warehouseStats.overview.totalQuantity}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: 'white',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Typography color="text.secondary">Jami qiymat</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                          {formatPrice(warehouseStats.overview.totalValue)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Category Stats */}
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 3,
                      border: '1px solid rgba(63, 81, 181, 0.1)',
                      overflow: 'hidden',
                      bgcolor: 'white',
                      mb: 3
                    }}
                  >
                    <Box sx={{ p: 3, borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      <Typography variant="h6" color="#3f51b5" fontWeight="bold">
                        Kategoriyalar bo'yicha
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Kategoriya
                            </TableCell>
                            <TableCell align="center" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Mahsulotlar soni
                            </TableCell>
                            <TableCell align="center" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Umumiy miqdor
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Umumiy qiymat
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {warehouseStats.categoryStats.map((category) => (
                            <TableRow key={category.categoryId}>
                              <TableCell>{category.categoryName}</TableCell>
                              <TableCell align="center">{category.productsCount}</TableCell>
                              <TableCell align="center">{category.totalQuantity}</TableCell>
                              <TableCell align="right">{formatPrice(category.totalValue)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {/* Low Stock Products */}
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 3,
                      border: '1px solid rgba(63, 81, 181, 0.1)',
                      overflow: 'hidden',
                      bgcolor: 'white',
                      mb: 3
                    }}
                  >
                    <Box sx={{ p: 3, borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      <Typography variant="h6" color="#3f51b5" fontWeight="bold">
                        Kam qolgan mahsulotlar
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Mahsulot</TableCell>
                            <TableCell align="center" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Qoldiq
                            </TableCell>
                            <TableCell align="center" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Narxi
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Umumiy qiymat
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {warehouseStats.lowStockProducts.map((product) => (
                            <TableRow key={product._id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Box 
                                    sx={{ 
                                      width: 40,
                                      height: 40,
                                      borderRadius: 2,
                                      bgcolor: 'rgba(244, 67, 54, 0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <WarningIcon sx={{ color: '#f44336' }} />
                                  </Box>
                                  <Box>
                                    <Typography>{product.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {product.category} • {product.unitSize} {product.unit}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                                {product.inventory}
                              </TableCell>
                              <TableCell align="center">{formatPrice(product.price)}</TableCell>
                              <TableCell align="right">{formatPrice(product.totalValue)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {/* Top Products */}
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 3,
                      border: '1px solid rgba(63, 81, 181, 0.1)',
                      overflow: 'hidden',
                      bgcolor: 'white'
                    }}
                  >
                    <Box sx={{ p: 3, borderBottom: '1px solid rgba(63, 81, 181, 0.1)' }}>
                      <Typography variant="h6" color="#3f51b5" fontWeight="bold">
                        Ko'p sotilgan mahsulotlar
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Mahsulot</TableCell>
                            <TableCell align="center" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              O'rtacha kunlik sotilish
                            </TableCell>
                            <TableCell align="center" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Jami sotilgan
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f5f5f5', color: '#3f51b5', fontWeight: 'bold' }}>
                              Jami summa
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {warehouseStats.productSalesHistory.map((product) => (
                            <TableRow key={product.name}>
                              <TableCell>
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
                                    <TrendingUpIcon sx={{ color: '#3f51b5' }} />
                                  </Box>
                                  <Box>
                                    <Typography>{product.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {product.category} • {product.unitSize} {product.unit}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">{product.averageDailySales.toFixed(1)}</TableCell>
                              <TableCell align="center">{product.totalQuantitySold}</TableCell>
                              <TableCell align="right">{formatPrice(product.totalAmountSold)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="h6">
                    <WarningIcon sx={{ mr: 1 }} />
                    Xatolik yuz berdi: {error}
                  </Typography>
                </Paper>
              ) : sellersStats ? (
                <>
                  

                  <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <StorefrontIcon sx={{ mr: 1 }} />
                          Sotuvchilar ro'yxati
                        </Box>
                      </Box>
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Sotuvchi</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Jami buyurtmalar soni">
                                <Box display="flex" alignItems="center" justifyContent="flex-end">
                                  <ShoppingBagIcon sx={{ mr: 0.5, fontSize: 20 }} />
                                  Buyurtmalar
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Jami savdo summasi">
                                <Box display="flex" alignItems="center" justifyContent="flex-end">
                                  <MonetizationOnIcon sx={{ mr: 0.5, fontSize: 20 }} />
                                  Jami savdo
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Sotilgan mahsulotlar soni">
                                <Box display="flex" alignItems="center" justifyContent="flex-end">
                                  <Inventory2Icon sx={{ mr: 0.5, fontSize: 20 }} />
                                  Mahsulotlar
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="O'rtacha buyurtma summasi">
                                <Box display="flex" alignItems="center" justifyContent="flex-end">
                                  <TrendingUpIcon sx={{ mr: 0.5, fontSize: 20 }} />
                                  O'rtacha buyurtma
                                </Box>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sellersStats.sellers.map((seller) => (
                            <TableRow key={seller.sellerId} hover onClick={() => handleSellerClick(seller)} sx={{ cursor: 'pointer' }}>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                    {seller.name.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2">{seller.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      @{seller.username}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={seller.totalOrders}
                                  color="primary"
                                  size="small"
                                  sx={{ minWidth: 60 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color="success.main">
                                  {formatPrice(seller.totalAmount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={seller.totalProducts}
                                  color="info"
                                  size="small"
                                  sx={{ minWidth: 60 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color="warning.main">
                                  {formatPrice(seller.averageOrderAmount)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {sellersStats.sellers.map((seller) => (
                    <Paper key={seller.sellerId} elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {seller.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">{seller.name} - Top 5 mahsulotlar</Typography>
                            <Typography variant="caption" color="textSecondary">
                              @{seller.username}
                            </Typography>
                          </Box>
                        </Box>
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Mahsulot</TableCell>
                              <TableCell align="right">
                                <Tooltip title="Sotilgan soni">
                                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                                    <Inventory2Icon sx={{ mr: 0.5, fontSize: 20 }} />
                                    Soni
                                  </Box>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Mahsulot narxi">
                                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                                    <MonetizationOnIcon sx={{ mr: 0.5, fontSize: 20 }} />
                                    Narxi
                                  </Box>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Jami savdo summasi">
                                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                                    <TrendingUpIcon sx={{ mr: 0.5, fontSize: 20 }} />
                                    Jami summa
                                  </Box>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {seller.topProducts.map((product) => (
                              <TableRow key={product.productId} hover>
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="subtitle2">{product.name}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={product.quantity}
                                    color="info"
                                    size="small"
                                    sx={{ minWidth: 60 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="subtitle2" color="success.main">
                                    {formatPrice(product.price)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="subtitle2" color="warning.main">
                                    {formatPrice(product.totalAmount)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  ))}
                </>
              ) : null}
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>

    <Dialog 
      open={Boolean(selectedSeller)} 
      onClose={() => setSelectedSeller(null)}
      maxWidth="md"
      fullWidth
    >
      {selectedSeller && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {selectedSeller?.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedSeller?.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    @{selectedSeller?.username}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setSelectedSeller(null)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab label="Statistika" />
              <Tab label="Barcha mahsulotlar" />
              <Tab label="Buyurtmalar tarixi" />
            </Tabs>
            <TabPanel value={selectedTab} index={0}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="textSecondary">
                      Birinchi buyurtma
                    </Typography>
                    <Typography variant="subtitle1">
                      {selectedSeller?.firstOrderDate ? (
                        <>
                          {new Date(selectedSeller.firstOrderDate).toLocaleDateString('uz-UZ')}
                          {' '}
                          {new Date(selectedSeller.firstOrderDate).toLocaleTimeString('uz-UZ')}
                        </>
                      ) : '-'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="textSecondary">
                      Oxirgi buyurtma
                    </Typography>
                    <Typography variant="subtitle1">
                      {selectedSeller?.lastOrderDate ? (
                        <>
                          {new Date(selectedSeller.lastOrderDate).toLocaleDateString('uz-UZ')}
                          {' '}
                          {new Date(selectedSeller.lastOrderDate).toLocaleTimeString('uz-UZ')}
                        </>
                      ) : '-'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <ShoppingBagIcon sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        Buyurtmalar
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {selectedSeller?.totalOrders || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MonetizationOnIcon sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        Jami savdo
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {formatPrice(selectedSeller?.totalAmount || 0)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Inventory2Icon sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        Mahsulotlar
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {selectedSeller?.totalProducts || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <TrendingUpIcon sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        O'rtacha buyurtma
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {formatPrice(selectedSeller?.averageOrderAmount || 0)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              
            </TabPanel>

            <TabPanel value={selectedTab} index={1}>
              <Box sx={{ mt: 0 }}>
                <Typography variant="h6" gutterBottom>
                  Barcha mahsulotlar
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Mahsulot nomini qidirish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Saralash</InputLabel>
                      <Select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        label="Saralash"
                      >
                        <MenuItem value="name">Nomi bo'yicha</MenuItem>
                        <MenuItem value="quantity">Soni bo'yicha</MenuItem>
                        <MenuItem value="price">Narxi bo'yicha</MenuItem>
                        <MenuItem value="total">Umumiy summa bo'yicha</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Tartib</InputLabel>
                      <Select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        label="Tartib"
                      >
                        <MenuItem value="asc">O'sish bo'yicha</MenuItem>
                        <MenuItem value="desc">Kamayish bo'yicha</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mahsulot</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Sotilgan soni">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                              <Inventory2Icon sx={{ mr: 0.5, fontSize: 20 }} />
                              Soni
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Mahsulot narxi">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                              <MonetizationOnIcon sx={{ mr: 0.5, fontSize: 20 }} />
                              Narxi
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Jami savdo summasi">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                              <TrendingUpIcon sx={{ mr: 0.5, fontSize: 20 }} />
                              Jami summa
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.productId} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="subtitle2">
                                {product.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.quantity}
                              color="info"
                              size="small"
                              sx={{ minWidth: 60 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="success.main">
                              {formatPrice(product.price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="warning.main">
                              {formatPrice(product.totalAmount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            <TabPanel value={selectedTab} index={2}>
              <Box sx={{ mt: 0 }}>
                <Typography variant="h6" gutterBottom>
                  Buyurtmalar tarixi
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Buyurtma ID bo'yicha qidirish..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="all">Barchasi</MenuItem>
                        <MenuItem value="completed">Yakunlangan</MenuItem>
                        <MenuItem value="pending">Kutilmoqda</MenuItem>
                        <MenuItem value="cancelled">Bekor qilingan</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Sana bo'yicha</InputLabel>
                      <Select
                        value={dateRange.startDate ? 'custom' : 'all'}
                        onChange={(e) => {
                          if (e.target.value === 'all') {
                            setDateRange({ startDate: '', endDate: '' });
                          } else if (e.target.value === 'today') {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            setDateRange({
                              startDate: today.toISOString(),
                              endDate: new Date().toISOString()
                            });
                          } else if (e.target.value === 'week') {
                            const today = new Date();
                            const weekAgo = new Date(today);
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            setDateRange({
                              startDate: weekAgo.toISOString(),
                              endDate: today.toISOString()
                            });
                          } else if (e.target.value === 'month') {
                            const today = new Date();
                            const monthAgo = new Date(today);
                            monthAgo.setMonth(monthAgo.getMonth() - 1);
                            setDateRange({
                              startDate: monthAgo.toISOString(),
                              endDate: today.toISOString()
                            });
                          }
                        }}
                        label="Sana bo'yicha"
                      >
                        <MenuItem value="all">Barchasi</MenuItem>
                        <MenuItem value="today">Bugun</MenuItem>
                        <MenuItem value="week">Oxirgi 7 kun</MenuItem>
                        <MenuItem value="month">Oxirgi 30 kun</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Buyurtma ID</TableCell>
                        <TableCell>Sana</TableCell>
                        <TableCell>Mahsulotlar</TableCell>
                        <TableCell align="right">Status</TableCell>
                        <TableCell align="right">Summa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSeller?.orders
                        ?.filter(order => {
                          // ID bo'yicha qidirish
                          if (orderSearchQuery && !order.orderId.toString().includes(orderSearchQuery)) {
                            return false;
                          }
                          // Status bo'yicha filterlash
                          if (orderStatus !== 'all' && order.status !== orderStatus) {
                            return false;
                          }
                          // Sana bo'yicha filterlash
                          if (dateRange.startDate && dateRange.endDate) {
                            const orderDate = new Date(order.createdAt);
                            const start = new Date(dateRange.startDate);
                            const end = new Date(dateRange.endDate);
                            if (orderDate < start || orderDate > end) {
                              return false;
                            }
                          }
                          return true;
                        })
                        ?.map((order) => (
                          <TableRow key={order.orderId} hover>
                            <TableCell>
                              <Typography variant="subtitle2">
                                #{order.orderId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(order.createdAt).toLocaleTimeString('uz-UZ')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {order.products.map((product, index) => (
                                <Box key={product._id} sx={{ mb: index !== order.products.length - 1 ? 1 : 0 }}>
                                  <Typography variant="body2">
                                    {product.name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {product.quantity} {product.unit} ({product.unitSize} {product.unit})
                                  </Typography>
                                </Box>
                              ))}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={
                                  order.status === 'completed' ? 'Yakunlangan' :
                                  order.status === 'pending' ? 'Kutilmoqda' :
                                  order.status === 'cancelled' ? 'Bekor qilingan' : 
                                  order.status
                                }
                                color={
                                  order.status === 'completed' ? 'success' :
                                  order.status === 'pending' ? 'warning' :
                                  order.status === 'cancelled' ? 'error' : 
                                  'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2" color="success.main">
                                {formatPrice(order.totalSum)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>
          </DialogContent>
        </>
      )}
    </Dialog>
    </>

  );
};

export default Statistics;