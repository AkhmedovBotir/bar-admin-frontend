import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  InputAdornment,
  TextField,
  useTheme,
  Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const Statistics = () => {
  const theme = useTheme();
  const [period, setPeriod] = useState('daily');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    salesData: []
  });
  const [receipts, setReceipts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`https://winstrikebackend.mixmall.uz/api/statistics/${period}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Statistikani yuklashda xatolik:', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      const response = await axios.get('https://winstrikebackend.mixmall.uz/api/receipts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setReceipts(response.data);
    } catch (err) {
      console.error('Cheklarni yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReceipts();
  }, [period]);

  const handleChangePeriod = (event, newValue) => {
    setPeriod(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptDialogOpen(true);
  };

  const handleCloseReceipt = () => {
    setSelectedReceipt(null);
    setReceiptDialogOpen(false);
  };

  const downloadReport = async () => {
    try {
      const response = await axios.get(
        `https://winstrikebackend.mixmall.uz/api/statistics/${period}/export`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hisobot-${period}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Hisobotni yuklashda xatolik:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.seller.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = {
    labels: stats.salesData.map(item => item.date),
    datasets: [
      {
        label: 'Savdo',
        data: stats.salesData.map(item => item.amount),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Statistika kartlari */}
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ 
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    mr: 2
                  }}
                >
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h6">
                  Umumiy savdo
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {formatPrice(stats.totalSales)} so'm
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {period === 'daily' ? 'Bugun' : period === 'weekly' ? 'Bu hafta' : 'Bu oy'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'warning.lighter',
                    color: 'warning.main',
                    mr: 2
                  }}
                >
                  <ShoppingCartIcon />
                </Avatar>
                <Typography variant="h6">
                  Buyurtmalar
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {period === 'daily' ? 'Bugun' : period === 'weekly' ? 'Bu hafta' : 'Bu oy'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'success.lighter',
                    color: 'success.main',
                    mr: 2
                  }}
                >
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6">
                  Mijozlar
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats.totalCustomers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {period === 'daily' ? 'Bugun' : period === 'weekly' ? 'Bu hafta' : 'Bu oy'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'info.lighter',
                    color: 'info.main',
                    mr: 2
                  }}
                >
                  <AccountBalanceIcon />
                </Avatar>
                <Typography variant="h6">
                  O'rtacha buyurtma
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {formatPrice(stats.averageOrderValue)} so'm
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {period === 'daily' ? 'Bugun' : period === 'weekly' ? 'Bu hafta' : 'Bu oy'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Grafik */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: '12px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    mr: 2
                  }}
                >
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h6">
                  Savdo dinamikasi
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tabs 
                  value={period} 
                  onChange={handleChangePeriod}
                  sx={{
                    '& .MuiTabs-indicator': {
                      borderRadius: '10px'
                    }
                  }}
                >
                  <Tab 
                    icon={<CalendarMonthIcon />} 
                    label="Kunlik" 
                    value="daily"
                    sx={{ 
                      textTransform: 'none',
                      minHeight: 'auto',
                      py: 1
                    }}
                  />
                  <Tab 
                    icon={<DateRangeIcon />} 
                    label="Haftalik" 
                    value="weekly"
                    sx={{ 
                      textTransform: 'none',
                      minHeight: 'auto',
                      py: 1
                    }}
                  />
                  <Tab 
                    icon={<DateRangeIcon />} 
                    label="Oylik" 
                    value="monthly"
                    sx={{ 
                      textTransform: 'none',
                      minHeight: 'auto',
                      py: 1
                    }}
                  />
                </Tabs>
                <Tooltip title="Hisobotni yuklab olish">
                  <IconButton
                    onClick={downloadReport}
                    sx={{ 
                      ml: 2,
                      color: 'primary.main',
                      bgcolor: 'primary.lighter',
                      '&:hover': {
                        bgcolor: 'primary.light'
                      }
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ height: 400, mt: 3 }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Cheklar jadvali */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: '12px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Cheklar
              </Typography>
              <TextField
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ width: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '8px' }
                }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Sana</TableCell>
                    <TableCell>Mijoz</TableCell>
                    <TableCell>Sotuvchi</TableCell>
                    <TableCell>Summa</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amallar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReceipts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((receipt) => (
                      <TableRow key={receipt._id}>
                        <TableCell>{receipt._id}</TableCell>
                        <TableCell>
                          {format(new Date(receipt.createdAt), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{receipt.customer}</TableCell>
                        <TableCell>{receipt.seller}</TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formatPrice(receipt.totalAmount)} so'm
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={receipt.status}
                            size="small"
                            sx={{ 
                              bgcolor: receipt.status === 'completed' ? 'success.light' : 'warning.light',
                              color: receipt.status === 'completed' ? 'success.main' : 'warning.main',
                              fontWeight: 500
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Chekni ko'rish">
                            <IconButton 
                              onClick={() => handleOpenReceipt(receipt)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.lighter' }
                              }}
                            >
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Yuklab olish">
                            <IconButton
                              onClick={() => downloadReceipt(receipt._id)}
                              sx={{ 
                                color: 'success.main',
                                '&:hover': { bgcolor: 'success.lighter' }
                              }}
                            >
                              <DownloadIcon />
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
              count={filteredReceipts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Qatorlar soni:"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Chek ma'lumotlari dialogi */}
      <Dialog 
        open={receiptDialogOpen} 
        onClose={handleCloseReceipt}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle>
          Chek #{selectedReceipt?._id}
        </DialogTitle>
        <DialogContent>
          {selectedReceipt && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Sana
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedReceipt.createdAt), 'dd.MM.yyyy HH:mm')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={selectedReceipt.status}
                    size="small"
                    sx={{ 
                      bgcolor: selectedReceipt.status === 'completed' ? 'success.light' : 'warning.light',
                      color: selectedReceipt.status === 'completed' ? 'success.main' : 'warning.main',
                      fontWeight: 500
                    }} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Mijoz
                  </Typography>
                  <Typography variant="body1">
                    {selectedReceipt.customer}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Sotuvchi
                  </Typography>
                  <Typography variant="body1">
                    {selectedReceipt.seller}
                  </Typography>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mahsulot</TableCell>
                      <TableCell align="right">Narxi</TableCell>
                      <TableCell align="right">Soni</TableCell>
                      <TableCell align="right">Jami</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedReceipt.items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell align="right">
                          {formatPrice(item.price)} so'm
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {formatPrice(item.price * item.quantity)} so'm
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 500 }}>
                        Jami:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatPrice(selectedReceipt.totalAmount)} so'm
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={handleCloseReceipt}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Yopish
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => downloadReceipt(selectedReceipt._id)}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Yuklab olish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Statistics;
