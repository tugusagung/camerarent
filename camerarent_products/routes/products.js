const express = require('express');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getProductsByCategory,
  addToCart,
  getCartByUser,
  deleteFromCart,
  checkoutItem,
  checkoutPayment,
  getTransactionDetails,
  createPayment,
  getTransactionData,
  getProductStockDetails,
  getAllTransactions,
  updateTransactionStatus
} = require('../controller/productController');

const router = express.Router();

// Ambil semua produk
router.get('/', getAllProducts);

router.get('/stat', getTransactionData);

// Ambil produk berdasarkan ID
router.get('/:id', getProductById);

// Ambil produk berdasarkan Category
router.get('/category/:category', getProductsByCategory);

// Membuat produk baru
router.post('/create', createProduct);

// Update produk berdasarkan ID
router.put('/:id', updateProduct);

router.put('/transaction/status/:id', updateTransactionStatus);


// Hapus produk berdasarkan ID
router.delete('/:id', deleteProduct);

router.post('/upload', uploadImage)

router.post('/cart', addToCart); // Tambah item ke keranjang

router.get('/cart/:user_id', getCartByUser); // Ambil item keranjang

// Route untuk menghapus item dari keranjang
router.delete('/cart/:cart_id', deleteFromCart);

router.post('/cart/checkout', checkoutItem);

router.post('/cart/payment', checkoutPayment);

router.get('/transaction/all', getAllTransactions);

router.get('/transaction/:id', getTransactionDetails);

router.get('/stock/stock-details', getProductStockDetails);

router.post('/transaction/payment', createPayment);


module.exports = router;
