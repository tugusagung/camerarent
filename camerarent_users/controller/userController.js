const db = require('../connection/database');

// Mendapatkan semua pengguna
const getAllUsers = (req, res) => {
  db.query('SELECT * FROM cr_users', (err, results) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(results);
    }
  });
};

// Mendapatkan review pengguna
const getUserReview = (req, res) => {
  db.query('SELECT * FROM cr_review', (err, results) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(results);
    }
  });
};

// Mendapatkan pengguna berdasarkan ID
const getUserById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM cr_users WHERE user_id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).send(err.message);
    } else if (results.length === 0) {
      res.status(404).send('User not found');
    } else {
      res.json(results[0]);
    }
  });
};

// Mendapatkan transaksi pengguna berdasarkan ID
const getUserTransactionsById = (req, res) => {
  const { id } = req.params; 

  const query = `
    SELECT * FROM cr_transaction 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).send({ message: 'Database error', error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).send({ message: 'No transactions found for this user' });
    }

    res.json(results);
  });
};

// Membuat pengguna baru
const createUser = (req, res) => {
  const { fullname, email, password, address, phone, instagram, role } = req.body;
  
  if (!fullname || !email || !password || !role) {
    return res.status(400).send('fullname, email, password, and role are required');
  }
  
  db.query(
    'INSERT INTO cr_users (fullname, email, password, address, phone, instagram, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [fullname, email, password, address || null, phone || null, instagram || null, role],
    (err, results) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.status(201).json({
          message: 'User created successfully',
          user_id: results.insertId,
        });
      }
    }
  );
};

// Membuat review pengguna
const createUserReview = (req, res) => {
  const { fullname, review } = req.body;
  if (!fullname || !review) {
    return res.status(400).send('name and review are required');
  }

  db.query(
    'INSERT INTO cr_review (fullname, review) VALUES (?, ?)',
    [fullname, review],
    (err, results) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.status(201).json({
          message: 'Review created successfully',
          review_id: results.insertId,
        });
      }
    }
  );
}

// Membuat kontak pengguna
const createUserContact = (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) {
    return res.status(400).send('email and phone are required');
  }

  db.query(
    'INSERT INTO cr_contact (email, phone) VALUES (?, ?)',
    [email, phone],
    (err, results) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.status(201).json({
          message: 'Successfully sent!',
          contact_id: results.insertId,
        });
      }
    }
  );
}

// Memperbarui data pengguna
const updateUser = (req, res) => {
  const { id } = req.params;
  const { fullname, email, password, address, phone, instagram } = req.body;

  let query = 'UPDATE cr_users SET fullname = ?, email = ?, address = ?, phone = ?, instagram = ? WHERE user_id = ?';
  let params = [fullname, email, address, phone, instagram, id];

  if (password) {
      query = 'UPDATE cr_users SET fullname = ?, email = ?, password = ?, address = ?, phone = ?, instagram = ? WHERE user_id = ?';
      params = [fullname, email, password, address, phone, instagram, id];
  }

  db.query(query, params, (err, results) => {
      if (err) {
          res.status(500).send(err.message);
      } else if (results.affectedRows === 0) {
          res.status(404).send('User not found');
      } else {
          res.json({ message: 'User updated successfully' });
      }
  });
};

// Menghapus pengguna
const deleteUser = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM cr_users WHERE user_id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).send(err.message);
    } else if (results.affectedRows === 0) {
      res.status(404).send('User not found');
    } else {
      res.json({ message: 'User deleted successfully' });
    }
  });
};

// SignIn pengguna
const signInUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).send('Email and password are required');
  }

  db.query(
      'SELECT * FROM cr_users WHERE email = ?',
      [email],
      (err, results) => {
          if (err) {
              return res.status(500).send('Database error: ' + err.message);
          }
          if (results.length === 0) {
              return res.status(404).send('User not found');
          }

          const user = results[0];

          // Validasi password
          const isPasswordValid = user.password === password; // Ganti dengan bcrypt.compare jika password terenkripsi
          if (!isPasswordValid) {
              return res.status(401).send('Invalid password');
          }

          // Cek role pengguna
          const role = user.role;
          if (role === 'admin') {
              return res.status(200).json({
                  message: 'Admin signed in successfully',
                  redirectTo: 'AdminDashboard.php',
                  user_id: user.user_id,
                  fullname: user.fullname,
                  email: user.email,
                  phone: user.phone,
                  instagram: user.instagram,
                  role: user.role
              });
          } else if (role === 'user') {
              return res.status(200).json({
                  message: 'User signed in successfully',
                  redirectTo: 'index.php',
                  user_id: user.user_id,
                  fullname: user.fullname,
                  email: user.email,
                  phone: user.phone,
                  instagram: user.instagram,
                  role: user.role
              });
          } else {
              return res.status(403).send('Invalid role'); // Untuk role yang tidak dikenali
          }
      }
  );
};
  
module.exports = {
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
};
