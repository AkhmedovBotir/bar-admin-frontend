import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import { LoadingButton } from '@mui/lab';
import DeleteDialog from '../components/DeleteDialog';
import Snackbar from '../components/Snackbar';

const Products = () => {
  const [products, setProducts] = useState({ items: [], total: 0 });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViewProduct, setSelectedViewProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    unit: 'dona',
    unitSize: '',
    inventory: '',
    quantity: ''
  });

  const [loading, setLoading] = useState(false);

  // Filter holatlar
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    subcategory: ''
  });
  const [filterCategory, setFilterCategory] = useState(null);

  // Mahsulotlarni yuklash
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Kategoriyalarni olish
      const categoriesResponse = await axios.get('https://winstrikebackend.mixmall.uz/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mahsulotlarni olish
      const productsResponse = await axios.get('https://winstrikebackend.mixmall.uz/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (productsResponse.data.success) {
        const productsData = productsResponse.data.data;
        const categories = categoriesResponse.data || [];
        
        // Har bir mahsulot uchun subkategoriya nomini topish
        const productsWithSubcategories = {
          ...productsData,
          items: productsData.items.map(product => {
            const category = categories.find(cat => cat._id === product.category?._id);
            const subcategory = category?.subcategories?.find(sub => sub._id === product.subcategory);
            
            return {
              ...product,
              subcategoryName: subcategory?.name || '-'
            };
          })
        };
        
        setProducts(productsWithSubcategories);
      }
    } catch (error) {
      console.error('Error fetching products:', error.response || error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Mahsulotlarni yuklashda xatolik',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, rowsPerPage, orderBy, order, searchTerm, selectedCategory, selectedSubcategory]);

  // Kategoriyalarni yuklash
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://winstrikebackend.mixmall.uz/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // API response to'g'ridan-to'g'ri array qaytaryapti
      setCategories(response.data || []);
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Kategoriyalarni yuklashda xatolik',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log('Current categories state:', categories);
  }, [categories]);

  // Kategoriya o'zgarganda
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const category = categories.find(cat => cat._id === categoryId);
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setFormData({
      ...formData,
      category: categoryId,
      subcategory: ''
    });
  };

  // Subkategoriya o'zgarganda
  const handleSubcategoryChange = (e) => {
    const subcategoryId = e.target.value;
    const subcategory = selectedCategory?.subcategories.find(sub => sub._id === subcategoryId);
    setSelectedSubcategory(subcategory);
    setFormData({
      ...formData,
      subcategory: subcategoryId
    });
  };

  // Mahsulot qo'shish/yangilash
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        price: Number(formData.price),
        unit: formData.unit,
        unitSize: formData.unit === 'dona' ? null : Number(formData.unitSize),
        inventory: formData.unit === 'dona' ? Number(formData.quantity) : Number(formData.quantity)
      };

      let response;
      
      if (selectedProduct) {
        // Mahsulotni yangilash
        response = await axios({
          method: 'PUT',
          url: `https://winstrikebackend.mixmall.uz/api/products/${selectedProduct._id}`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: productData
        });

        setSnackbar({
          open: true,
          message: 'Mahsulot muvaffaqiyatli yangilandi',
          severity: 'success'
        });
      } else {
        // Yangi mahsulot qo'shish
        response = await axios({
          method: 'POST',
          url: 'https://winstrikebackend.mixmall.uz/api/products',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: productData
        });

        setSnackbar({
          open: true,
          message: 'Mahsulot muvaffaqiyatli qo\'shildi',
          severity: 'success'
        });
      }

      if (response.data.success) {
        handleCloseDialog();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error submitting product:', error.response || error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Mahsulotni saqlashda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Form ma'lumotlarini tozalash
  const resetFormData = () => {
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      unit: 'dona',
      unitSize: '',
      inventory: '',
      quantity: ''
    });
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  // Dialog yopilganda
  const handleCloseDialog = () => {
    setSelectedProduct(null);
    resetFormData();
    setOpenDialog(false);
  };

  // Mahsulotni tahrirlash
  const handleEdit = async (product) => {
    setSelectedProduct(product);
    
    // Kategoriyani topish va o'rnatish
    const category = categories.find(cat => cat._id === product.category?._id);
    setSelectedCategory(category);
    
    // Subkategoriyani topish va o'rnatish
    const subcategory = category?.subcategories.find(sub => sub._id === product.subcategory?._id);
    setSelectedSubcategory(subcategory);

    setFormData({
      name: product.name,
      category: product.category?._id || '',
      subcategory: product.subcategory?._id || '',
      price: product.price || '',
      unit: product.unit || 'dona',
      unitSize: product.unitSize || '',
      inventory: product.inventory || '',
      quantity: product.inventory || ''
    });

    setOpenDialog(true);
  };

  // Inventarizatsiyani yangilash
  const handleInventoryUpdate = async (productId, quantity, isAddition) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://winstrikebackend.mixmall.uz/api/products/${productId}/inventory`,
        {
          quantity: Number(quantity),
          isAddition
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Inventarizatsiya muvaffaqiyatli yangilandi',
          severity: 'success'
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Xatolik yuz berdi',
        severity: 'error'
      });
    }
  };

  // Mahsulotni o'chirish
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `https://winstrikebackend.mixmall.uz/api/products/${selectedProduct._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success'
        });
        setDeleteDialogOpen(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Xatolik yuz berdi',
        severity: 'error'
      });
    }
  };

  // O'chirish dialogini ochish
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  // Dialogni yopish
  const handleClose = () => {
    setOpenDialog(false);
    setEditMode(false);
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      unit: 'dona',
      unitSize: '',
      inventory: '',
      quantity: ''
    });
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setEditMode(false);
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      unit: 'dona',
      unitSize: '',
      inventory: '',
      quantity: ''
    });
  };

  const handleOpenInventoryDialog = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseInventoryDialog = () => {
    setSelectedProduct(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleViewProduct = (product) => {
    // Subkategoriyani topish
    const subcategory = categories
      .find(cat => cat._id === product.category._id)
      ?.subcategories
      .find(sub => sub._id === product.subcategory);

    console.log('Product Details:', {
      id: product._id,
      name: product.name,
      category: product.category,
      subcategory: subcategory ? {
        _id: subcategory._id,
        name: subcategory.name
      } : null,
      price: product.price,
      unit: product.unit,
      unitSize: product.unitSize,
      inventory: product.inventory,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    });
    
    // Subkategoriya ma'lumotini qo'shib saqlash
    setSelectedViewProduct({
      ...product,
      subcategory: subcategory ? {
        _id: subcategory._id,
        name: subcategory.name
      } : null
    });
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setSelectedViewProduct(null);
    setViewDialogOpen(false);
  };

  // O'lchov birligi o'zgarganda
  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    setFormData({ 
      ...formData, 
      unit: newUnit,
      unitSize: '',
      inventory: '',
      quantity: ''
    });
  };

  // Saralash funksiyasi
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Ma'lumotlarni saralash
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Kategoriya va subkategoriya uchun maxsus holat
      if (orderBy === 'category') {
        aValue = a.category?.name || '';
        bValue = b.category?.name || '';
      }
      if (orderBy === 'subcategory') {
        // Subkategoriyani topish
        const aSubcategory = categories
          .find(cat => cat._id === a.category?._id)
          ?.subcategories
          .find(sub => sub._id === a.subcategory);
        const bSubcategory = categories
          .find(cat => cat._id === b.category?._id)
          ?.subcategories
          .find(sub => sub._id === b.subcategory);
        
        aValue = aSubcategory?.name || '';
        bValue = bSubcategory?.name || '';
      }

      // Agar son bo'lsa
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Agar string bo'lsa
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue, 'uz-UZ') 
          : bValue.localeCompare(aValue, 'uz-UZ');
      }

      return 0;
    });
  };

  // Ma'lumotlarni filtrlash
  const filterData = (data) => {
    return data.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(filters.name.toLowerCase());
      const categoryMatch = !filters.category || product.category?._id === filters.category;
      
      // Subkategoriyani tekshirish
      let subcategoryMatch = true;
      if (filters.subcategory) {
        subcategoryMatch = product.subcategory === filters.subcategory;
      }
      
      return nameMatch && categoryMatch && subcategoryMatch;
    });
  };

  // Filter kategoriya o'zgarganda
  const handleFilterCategoryChange = (e) => {
    const categoryId = e.target.value;
    const category = categories.find(cat => cat._id === categoryId);
    setFilterCategory(category);
    setFilters({
      ...filters,
      category: categoryId,
      subcategory: '' // Kategoriya o'zgarganda subkategoriyani tozalash
    });
  };

  // Filter subkategoriya o'zgarganda
  const handleFilterSubcategoryChange = (e) => {
    const subcategoryId = e.target.value;
    setFilters({
      ...filters,
      subcategory: subcategoryId
    });
  };

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Mahsulotlar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                backgroundColor: '#1E88E5',
                '&:hover': {
                  backgroundColor: '#1565C0',
                }
              }}
            >
              Yangi mahsulot
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2 }}>
            <TextField
              label="Nomi bo'yicha qidirish"
              size="small"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': { borderRadius: '8px' }
              }}
            />
            <TextField
              select
              label="Kategoriya bo'yicha"
              size="small"
              value={filters.category}
              onChange={handleFilterCategoryChange}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': { borderRadius: '8px' }
              }}
            >
              <MenuItem value="">
                <em>Barchasi</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            {filterCategory && (
              <TextField
                select
                label="Subkategoriya bo'yicha"
                size="small"
                value={filters.subcategory}
                onChange={handleFilterSubcategoryChange}
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                }}
              >
                <MenuItem value="">
                  <em>Barchasi</em>
                </MenuItem>
                {filterCategory.subcategories.map((subcategory) => (
                  <MenuItem key={subcategory._id} value={subcategory._id}>
                    {subcategory.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {(filters.name || filters.category || filters.subcategory) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setFilters({ name: '', category: '', subcategory: '' });
                  setFilterCategory(null);
                }}
                startIcon={<ClearIcon />}
              >
                Tozalash
              </Button>
            )}
          </Stack>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E0E0E0', borderRadius: '8px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleSort('name')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Nomi
                      {orderBy === 'name' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleSort('category')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Kategoriya
                      {orderBy === 'category' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleSort('subcategory')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Subkategoriya
                      {orderBy === 'subcategory' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleSort('price')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Narxi
                      {orderBy === 'price' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleSort('unit')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      O'lchov birligi
                      {orderBy === 'unit' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleSort('unitSize')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Birlik hajmi
                      {orderBy === 'unitSize' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleSort('inventory')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Soni
                      {orderBy === 'inventory' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Amallar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortData(filterData(products.items)).map((product) => {
                  // Subkategoriyani topish
                  const subcategory = categories
                    .find(cat => cat._id === product.category?._id)
                    ?.subcategories
                    .find(sub => sub._id === product.subcategory);

                  return (
                    <TableRow key={product._id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category?.name || '-'}</TableCell>
                      <TableCell>{subcategory?.name || '-'}</TableCell>
                      <TableCell>{product.price.toLocaleString()}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>{product.unitSize || '-'}</TableCell>
                      <TableCell>{product.inventory}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewProduct(product)}
                            sx={{ color: 'primary.main' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(product)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(product)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {products.items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" sx={{ py: 2, color: 'text.secondary' }}>
                        Ma'lumotlar topilmadi
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={products.total || 0}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Qatorlar soni:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} dan ${count}`}
            />
          </TableContainer>
        </CardContent>
      </Card>

      {/* Mahsulot qo'shish/tahrirlash dialogi */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle>
          {selectedProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nomi"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <TextField
              select
              label="Kategoriya"
              fullWidth
              required
              value={formData.category}
              onChange={handleCategoryChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              {categories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            {selectedCategory && (
              <TextField
                select
                label="Subkategoriya"
                fullWidth
                required
                value={formData.subcategory}
                onChange={handleSubcategoryChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              >
                {selectedCategory.subcategories.map((subcategory) => (
                  <MenuItem key={subcategory._id} value={subcategory._id}>
                    {subcategory.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Narxi"
              fullWidth
              required
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <TextField
              select
              label="O'lchov birligi"
              fullWidth
              required
              value={formData.unit}
              onChange={handleUnitChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              <MenuItem value="dona">Dona</MenuItem>
              <MenuItem value="kg">Kilogram</MenuItem>
              <MenuItem value="litr">Litr</MenuItem>
            </TextField>

            {formData.unit === 'kg' && (
              <>
                <TextField
                  label="Necha kg"
                  fullWidth
                  required
                  type="number"
                  value={formData.unitSize}
                  onChange={(e) => setFormData({ ...formData, unitSize: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                <TextField
                  label="Soni"
                  fullWidth
                  required
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </>
            )}

            {formData.unit === 'litr' && (
              <>
                <TextField
                  label="Necha litr"
                  fullWidth
                  required
                  type="number"
                  value={formData.unitSize}
                  onChange={(e) => setFormData({ ...formData, unitSize: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                <TextField
                  label="Soni"
                  fullWidth
                  required
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </>
            )}

            {formData.unit === 'dona' && (
              <TextField
                label="Necha dona"
                fullWidth
                required
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Bekor qilish
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={loading}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              backgroundColor: '#1E88E5',
              '&:hover': {
                backgroundColor: '#1565C0',
              }
            }}
          >
            {selectedProduct ? 'Saqlash' : 'Qo\'shish'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* O'chirish dialogi */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={loading}
        title="Mahsulotni o'chirish"
        description="Siz rostdan ham ushbu mahsulotni o'chirmoqchimisiz?"
      />

      {/* Ko'rish dialogi */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Mahsulot haqida ma'lumot
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedViewProduct && (
            <Stack spacing={2}>
              <Typography variant="subtitle1">
                <strong>Nomi:</strong> {selectedViewProduct.name}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Kategoriya:</strong> {selectedViewProduct.category?.name || '-'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Subkategoriya:</strong> {selectedViewProduct.subcategory?.name || '-'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Narxi:</strong> {selectedViewProduct.price?.toLocaleString()} so'm
              </Typography>
              <Typography variant="subtitle1">
                <strong>O'lchov birligi:</strong> {selectedViewProduct.unit}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Birlik hajmi:</strong> {selectedViewProduct.unitSize || '-'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Soni:</strong> {selectedViewProduct.inventory}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Yaratilgan vaqti:</strong> {new Date(selectedViewProduct.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="subtitle1">
                <strong>O'zgartirilgan vaqti:</strong> {new Date(selectedViewProduct.updatedAt).toLocaleString()}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default Products;
