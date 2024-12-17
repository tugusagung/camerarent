const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  signInUser,
  getUserTransactionsById,
  getUserReview,
  createUserReview,
  createUserContact
} = require('../controller/userController');

const router = express.Router();

// Untuk ambil semua user
router.get('/', getAllUsers);

router.get('/reviews', getUserReview);

// Ambil user berdasarkan id
router.get('/:id', getUserById);

router.get('/transaction/:id', getUserTransactionsById);

// Membuat user baru
router.post('/', createUser);

router.post('/reviews', createUserReview);

router.post('/contact', createUserContact);

// Sign In
router.post('/signin', signInUser);

// Update data user
router.put('/:id', updateUser);

// Hapus data user
router.delete('/:id', deleteUser);

module.exports = router;
