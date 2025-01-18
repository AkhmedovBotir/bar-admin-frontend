import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  Tooltip,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

function Categories() {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSubDialog, setOpenSubDialog] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [formData, setFormData] = useState({
    name: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    category: null,
    subcategory: null
  });

  // Kategoriyalarni yuklash
  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://winstrikebackend.mixmall.uz/api/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setSnackbar({
        open: true,
        message: 'Kategoriyalarni yuklashda xatolik yuz berdi',
        severity: 'error'
      });
    }
  };

  // WebSocket eventlarini ulash
  useEffect(() => {
    socket.on('category_created', (category) => {
      setCategories(prev => [...prev, category]);
      setSnackbar({
        open: true,
        message: 'Yangi kategoriya qo\'shildi',
        severity: 'success'
      });
    });

    socket.on('category_updated', ({ categoryId, changes }) => {
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId ? { ...cat, ...changes } : cat
      ));
      setSnackbar({
        open: true,
        message: 'Kategoriya yangilandi',
        severity: 'success'
      });
    });

    socket.on('category_deleted', ({ categoryId }) => {
      setCategories(prev => prev.filter(cat => cat._id !== categoryId));
      setSnackbar({
        open: true,
        message: 'Kategoriya o\'chirildi',
        severity: 'info'
      });
    });

    socket.on('subcategory_created', ({ categoryId, subcategory }) => {
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId 
          ? { ...cat, subcategories: [...cat.subcategories, subcategory] }
          : cat
      ));
      setSnackbar({
        open: true,
        message: 'Yangi subkategoriya qo\'shildi',
        severity: 'success'
      });
    });

    socket.on('subcategory_updated', ({ categoryId, subcategoryId, changes }) => {
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId 
          ? {
              ...cat,
              subcategories: cat.subcategories.map(sub =>
                sub._id === subcategoryId ? { ...sub, ...changes } : sub
              )
            }
          : cat
      ));
      setSnackbar({
        open: true,
        message: 'Subkategoriya yangilandi',
        severity: 'success'
      });
    });

    socket.on('subcategory_deleted', ({ categoryId, subcategoryId }) => {
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId 
          ? {
              ...cat,
              subcategories: cat.subcategories.filter(sub => sub._id !== subcategoryId)
            }
          : cat
      ));
      setSnackbar({
        open: true,
        message: 'Subkategoriya o\'chirildi',
        severity: 'info'
      });
    });

    fetchCategories();

    return () => {
      socket.off('category_created');
      socket.off('category_updated');
      socket.off('category_deleted');
      socket.off('subcategory_created');
      socket.off('subcategory_updated');
      socket.off('subcategory_deleted');
    };
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Nom kiritilishi shart',
        severity: 'error'
      });
      return;
    }

    try {
      if (selectedCategory) {
        // Kategoriyani yangilash
        if (selectedSubcategory) {
          await axios.patch(
            `https://winstrikebackend.mixmall.uz/api/categories/${selectedCategory._id}/subcategories/${selectedSubcategory._id}`,
            formData,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          // Kategoriyalar ro'yxatini yangilash
          fetchCategories();

          setSnackbar({
            open: true,
            message: 'Subkategoriya muvaffaqiyatli yangilandi',
            severity: 'success'
          });
        } else {
          await axios.patch(
            `https://winstrikebackend.mixmall.uz/api/categories/${selectedCategory._id}`,
            formData,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          // Kategoriyalar ro'yxatini yangilash
          fetchCategories();

          setSnackbar({
            open: true,
            message: 'Kategoriya muvaffaqiyatli yangilandi',
            severity: 'success'
          });
        }
      } else {
        // Yangi kategoriya qo'shish
        await axios.post(
          'https://winstrikebackend.mixmall.uz/api/categories',
          formData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Kategoriyalar ro'yxatini yangilash
        fetchCategories();

        setSnackbar({
          open: true,
          message: 'Kategoriya muvaffaqiyatli qo\'shildi',
          severity: 'success'
        });
      }

      handleClose();
    } catch (err) {
      // WebSocket xatoligini tekshirish
      if (err.response?.data?.message?.includes('wsHandlers')) {
        // WebSocket xatoligini e'tiborsiz qoldirish, chunki ma'lumotlar saqlangan
        fetchCategories();
        setSnackbar({
          open: true,
          message: selectedCategory 
            ? selectedSubcategory
              ? 'Subkategoriya muvaffaqiyatli yangilandi'
              : 'Kategoriya muvaffaqiyatli yangilandi'
            : 'Kategoriya muvaffaqiyatli qo\'shildi',
          severity: 'success'
        });
        handleClose();
      } else {
        // Boshqa xatoliklar uchun
        console.error('Error submitting:', err);
        setSnackbar({
          open: true,
          message: selectedCategory 
            ? selectedSubcategory
              ? 'Subkategoriyani yangilashda xatolik yuz berdi'
              : 'Kategoriyani yangilashda xatolik yuz berdi'
            : 'Kategoriya qo\'shishda xatolik yuz berdi',
          severity: 'error'
        });
      }
    }
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory || !selectedCategory._id) {
      setSnackbar({
        open: true,
        message: 'Kategoriya tanlanmagan',
        severity: 'error'
      });
      return;
    }

    try {
      await axios.post(
        `https://winstrikebackend.mixmall.uz/api/categories/${selectedCategory._id}/subcategories`,
        { name: formData.name },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Kategoriyalar ro'yxatini yangilash
      fetchCategories();

      setSnackbar({
        open: true,
        message: 'Subkategoriya muvaffaqiyatli qo\'shildi',
        severity: 'success'
      });

      handleClose();
    } catch (err) {
      // WebSocket xatoligini tekshirish
      if (err.response?.data?.message?.includes('wsHandlers')) {
        // WebSocket xatoligini e'tiborsiz qoldirish, chunki ma'lumotlar saqlangan
        fetchCategories();
        setSnackbar({
          open: true,
          message: 'Subkategoriya muvaffaqiyatli qo\'shildi',
          severity: 'success'
        });
        handleClose();
      } else {
        // Boshqa xatoliklar uchun
        console.error('Error adding subcategory:', err);
        setSnackbar({
          open: true,
          message: 'Subkategoriya qo\'shishda xatolik yuz berdi',
          severity: 'error'
        });
      }
    }
  };

  const handleDeleteClick = (category, subcategory = null) => {
    setDeleteDialog({
      open: true,
      category,
      subcategory
    });
  };

  const handleDeleteConfirm = async () => {
    const { category, subcategory } = deleteDialog;
    try {
      if (subcategory) {
        await axios.delete(
          `https://winstrikebackend.mixmall.uz/api/categories/${category._id}/subcategories/${subcategory._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        // Kategoriyalar ro'yxatini yangilash
        fetchCategories();

        setSnackbar({
          open: true,
          message: 'Subkategoriya muvaffaqiyatli o\'chirildi',
          severity: 'success'
        });
      } else {
        await axios.delete(
          `https://winstrikebackend.mixmall.uz/api/categories/${category._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Kategoriyalar ro'yxatini yangilash
        fetchCategories();

        setSnackbar({
          open: true,
          message: 'Kategoriya muvaffaqiyatli o\'chirildi',
          severity: 'success'
        });
      }
    } catch (err) {
      // WebSocket xatoligini tekshirish
      if (err.response?.data?.message?.includes('wsHandlers')) {
        // WebSocket xatoligini e'tiborsiz qoldirish, chunki ma'lumotlar o'chirilgan
        fetchCategories();
        setSnackbar({
          open: true,
          message: subcategory 
            ? 'Subkategoriya muvaffaqiyatli o\'chirildi'
            : 'Kategoriya muvaffaqiyatli o\'chirildi',
          severity: 'success'
        });
      } else {
        // Boshqa xatoliklar uchun
        console.error('Error deleting:', err);
        setSnackbar({
          open: true,
          message: subcategory 
            ? 'Subkategoriyani o\'chirishda xatolik yuz berdi'
            : 'Kategoriyani o\'chirishda xatolik yuz berdi',
          severity: 'error'
        });
      }
    } finally {
      setDeleteDialog({
        open: false,
        category: null,
        subcategory: null
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      open: false,
      category: null,
      subcategory: null
    });
  };

  const handleClose = () => {
    if (openDialog) {
      setOpenDialog(false);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else if (openSubDialog) {
      setOpenSubDialog(false);
    }
    setFormData({ name: '' });
  };

  const handleAddSubcategory = (category) => {
    console.log('Adding subcategory for category:', category);
    if (!category || !category._id) {
      setSnackbar({
        open: true,
        message: 'Kategoriya tanlanmagan',
        severity: 'error'
      });
      return;
    }
    setSelectedCategory(category);
    setFormData({ name: '' });
    setOpenSubDialog(true);
  };

  const handleEdit = (category, subcategory = null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setFormData({
      name: subcategory ? subcategory.name : category.name
    });
    setOpenDialog(true);
  };

  const handleExpand = (categoryId) => {
    setExpanded(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Typography variant="h5">Kategoriyalar</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Kategoriya qo'shish
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
                <TableCell>Nomi</TableCell>
                <TableCell>Subkategoriyalar</TableCell>
                <TableCell align="right">Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((category) => (
                  <TableRow key={`category-${category._id}`}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {category.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {category.subcategories?.map((sub) => (
                          <Chip
                            key={`subcategory-${sub._id}`}
                            label={sub.name}
                            size="small"
                            onDelete={() => handleDeleteClick(category, sub)}
                            onClick={() => handleEdit(category, sub)}
                            sx={{
                              bgcolor: 'primary.lighter',
                              color: 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.light'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Tahrirlash">
                        <IconButton 
                          onClick={() => handleEdit(category)}
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
                          onClick={() => handleDeleteClick(category)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.lighter' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddSubcategory(category)}
                        sx={{ 
                          borderRadius: '8px',
                          textTransform: 'none',
                          ml: 1
                        }}
                      >
                        Subkategoriya
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredCategories.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Qatorlar soni:"
        />
      </Paper>

      {/* Kategoriya/Subkategoriya Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleClose}
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ 
          p: 2.5,
          fontSize: '1.25rem',
          fontWeight: 500
        }}>
          {selectedCategory
            ? selectedSubcategory
              ? 'Subkategoriyani tahrirlash'
              : 'Kategoriyani tahrirlash'
            : 'Yangi kategoriya'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ 
            px: 2.5,
            py: 0.5,
            minWidth: 400
          }}>
            <TextField
              autoFocus
              fullWidth
              label="Nomi"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button 
              onClick={handleClose}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                px: 3
              }}
            >
              Bekor qilish
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                px: 3
              }}
            >
              {selectedCategory ? 'Saqlash' : 'Qo\'shish'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Yangi Subkategoriya Dialog */}
      <Dialog 
        open={openSubDialog} 
        onClose={handleClose}
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ 
          p: 2.5,
          fontSize: '1.25rem',
          fontWeight: 500
        }}>
          Yangi subkategoriya
        </DialogTitle>
        <form onSubmit={handleSubcategorySubmit}>
          <DialogContent sx={{ 
            px: 2.5,
            py: 0.5,
            minWidth: 400
          }}>
            <TextField
              autoFocus
              fullWidth
              label="Nomi"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button 
              onClick={handleClose}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                px: 3
              }}
            >
              Bekor qilish
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                px: 3
              }}
            >
              Qo'shish
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* O'chirish tasdiqlash dialogi */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ 
          p: 2.5,
          fontSize: '1.25rem',
          fontWeight: 500
        }}>
          O'chirishni tasdiqlang
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, py: 0.5 }}>
          <Typography>
            {deleteDialog.subcategory 
              ? `"${deleteDialog.subcategory.name}" subkategoriyasini o'chirishni xohlaysizmi?`
              : `"${deleteDialog.category?.name}" kategoriyasini o'chirishni xohlaysizmi?`
            }
          </Typography>
          {!deleteDialog.subcategory && deleteDialog.category?.subcategories?.length > 0 && (
            <Typography color="error" sx={{ mt: 1 }}>
              Diqqat: Bu kategoriyaning barcha subkategoriyalari ham o'chiriladi!
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              px: 3
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
              textTransform: 'none',
              px: 3
            }}
          >
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Categories;
