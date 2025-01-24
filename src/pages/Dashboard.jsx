import React, { useState, useEffect } from 'react';
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
  Tooltip
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

  const fetchTopProducts = async () => {
    try {
      const response = await axios.get('https://barback.mixmall.uz/api/product/top', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTopProducts(response.data);
    } catch (err) {
      console.error('Mahsulotlarni yuklashda xatolik:', err);
    }
  };

  const fetchTopSellers = async () => {
    try {
      const response = await axios.get('https://barback.mixmall.uz/api/seller/top', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTopSellers(response.data);
    } catch (err) {
      console.error('Sotuvchilarni yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    fetchTopProducts();
    fetchTopSellers();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  return (
    <Box>
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
                  {topProducts.map((product, index) => (
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
                          label={product.category}
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
                </TableBody>
              </Table>
            </TableContainer>
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
                  {topSellers.map((seller, index) => (
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
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
