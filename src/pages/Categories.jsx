import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
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
  useTheme,
  CircularProgress
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
    name: '',
    description: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    category: null,
    subcategory: null
  });

  // Kategoriyalarni yuklash
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/category');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Kategoriyalarni yuklashda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // WebSocket eventlarini ulash
  useEffect(() => {
    socket.on('CATEGORY_CREATED', (data) => {
      const { category } = data;
      setCategories(prev => [...prev, category]);
      setSnackbar({
        open: true,
        message: 'Yangi kategoriya qo\'shildi',
        severity: 'success'
      });
    });

    socket.on('CATEGORY_UPDATED', (data) => {
      const { category } = data;
      setCategories(prev => prev.map(cat => 
        cat._id === category._id ? category : cat
      ));
      setSnackbar({
        open: true,
        message: 'Kategoriya yangilandi',
        severity: 'success'
      });
    });

    socket.on('CATEGORY_DELETED', (data) => {
      const { categoryId } = data;
      setCategories(prev => prev.filter(cat => cat._id !== categoryId));
      setSnackbar({
        open: true,
        message: 'Kategoriya o\'chirildi',
        severity: 'info'
      });
    });

    socket.on('SUBCATEGORY_CREATED', ({ categoryId, subcategory }) => {
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

    socket.on('SUBCATEGORY_UPDATED', ({ categoryId, subcategoryId, changes }) => {
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

    socket.on('SUBCATEGORY_DELETED', ({ categoryId, subcategoryId }) => {
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
      socket.off('CATEGORY_CREATED');
      socket.off('CATEGORY_UPDATED');
      socket.off('CATEGORY_DELETED');
      socket.off('SUBCATEGORY_CREATED');
      socket.off('SUBCATEGORY_UPDATED');
      socket.off('SUBCATEGORY_DELETED');
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
    setLoading(true);

    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Nom kiritilishi shart',
        severity: 'error'
      });
      setLoading(false);
      return;
    }

    try {
      if (selectedCategory) {
        // Kategoriyani yangilash
        const response = await api.put(
          `/api/category/${selectedCategory._id}`,
          { name: formData.name }
        );

        if (response.status === 200) {
          setOpenDialog(false);
          setFormData({ name: '', description: '' });
          setSnackbar({
            open: true,
            message: 'Kategoriya muvaffaqiyatli yangilandi',
            severity: 'success'
          });
          fetchCategories();
        }
      } else {
        // Yangi kategoriya qo'shish
        const response = await api.post('/api/category', {
          name: formData.name
        });

        if (response.status === 201) {
          setOpenDialog(false);
          setFormData({ name: '', description: '' });
          setSnackbar({
            open: true,
            message: 'Kategoriya muvaffaqiyatli qo\'shildi',
            severity: 'success'
          });
          fetchCategories();
        }
      }
    } catch (err) {
      console.error('Error submitting:', err);
      let errorMessage = 'Xatolik yuz berdi';
      
      if (err.response) {
        switch (err.response.status) {
          case 400:
            errorMessage = 'Noto\'g\'ri ma\'lumot kiritildi';
            break;
          case 404:
            errorMessage = 'Kategoriya topilmadi';
            break;
          case 500:
            errorMessage = 'Serverda xatolik yuz berdi';
            break;
          default:
            errorMessage = err.response.data?.message || 'Xatolik yuz berdi';
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
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
      await api.post(
        `/api/category/${selectedCategory._id}/subcategories`,
        { name: formData.name }
      );

      fetchCategories();

      setSnackbar({
        open: true,
        message: 'Subkategoriya muvaffaqiyatli qo\'shildi',
        severity: 'success'
      });

      handleClose();
    } catch (err) {
      console.error('Error adding subcategory:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Subkategoriya qo\'shishda xatolik yuz berdi',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (category, subcategory = null) => {
    try {
      if (subcategory) {
        await api.delete(
          `/api/category/${category._id}/subcategories/${subcategory._id}`
        );
      } else {
        await api.delete(`/api/category/${category._id}`);
      }
      
      fetchCategories();
      setDeleteDialog({ open: false, category: null });
      setSnackbar({
        open: true,
        message: subcategory ? 'Subkategoriya o\'chirildi' : 'Kategoriya o\'chirildi',
        severity: 'success'
      });
    } catch (err) {
      console.error('Delete error:', err);
      let errorMessage = 'O\'chirishda xatolik yuz berdi';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = 'Kategoriya topilmadi';
            break;
          case 500:
            errorMessage = 'Serverda xatolik yuz berdi';
            break;
          default:
            errorMessage = err.response.data?.message || 'O\'chirishda xatolik yuz berdi';
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
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
    await handleDelete(category, subcategory);
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
    setFormData({ name: '', description: '' });
  };

  const handleAddClick = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setFormData({ name: '', description: '' });
    setOpenDialog(true);
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
    setFormData({ name: '', description: '' });
    setOpenSubDialog(true);
  };

  const handleEdit = (category, subcategory = null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setFormData({
      name: subcategory ? subcategory.name : category.name,
      description: subcategory ? subcategory.description : ''
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
            onClick={handleAddClick}
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
                      {/* Yangilash tugmasi vaqtincha o'chirildi
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEdit(category)}
                      >
                        <EditIcon />
                      </IconButton>
                      */}
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory 
            ? selectedSubcategory
              ? 'Subkategoriyani tahrirlash'
              : 'Kategoriyani tahrirlash'
            : 'Yangi kategoriya qo\'shish'
          }
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Nomi"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Bekor qilish</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedCategory 
              ? selectedSubcategory
                ? 'Saqlash'
                : 'Yangilash'
              : 'Qo\'shish'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yangi Subkategoriya Dialog */}
      <Dialog 
        open={openSubDialog} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Yangi subkategoriya
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubcategorySubmit} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Nomi"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Bekor qilish</Button>
          <Button onClick={handleSubcategorySubmit} variant="contained" color="primary">
            Qo'shish
          </Button>
        </DialogActions>
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
