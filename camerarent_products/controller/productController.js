const db = require('../connection/database');

const multer = require('multer');
const path = require('path');
const fs = require('fs');


    const getAllProducts = (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // Products per page
        const offset = (page - 1) * limit;
        const searchQuery = req.query.search ? `%${req.query.search}%` : null;

        let countQuery = 'SELECT COUNT(*) AS total FROM cr_products';
        let dataQuery = 'SELECT * FROM cr_products';
        const params = [];

        if (searchQuery) {
            countQuery += ' WHERE product_name LIKE ?';
            dataQuery += ' WHERE product_name LIKE ?';
            params.push(searchQuery);
        }

        dataQuery += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // First, get total count of products
        db.query(countQuery, searchQuery ? [searchQuery] : [], (countErr, countResults) => {
            if (countErr) {
                return res.status(500).send(countErr.message);
            }

            const totalProducts = countResults[0].total;
            const totalPages = Math.ceil(totalProducts / limit);

            // Then, get paginated products
            db.query(dataQuery, params, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }

                res.status(200).json({
                    products: results,
                    currentPage: page,
                    totalPages: totalPages,
                    totalProducts: totalProducts,
                    search: req.query.search || null,
                });
            });
        });
    };

    
    const getAllTransactions = (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 4; // Transactions per page
        const offset = (page - 1) * limit;
    
        let countQuery = 'SELECT COUNT(*) AS total FROM cr_transaction';
        let dataQuery = 'SELECT * FROM cr_transaction';
        const params = [];
    
        dataQuery += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
    
        // First, get the total count of transactions
        db.query(countQuery, (countErr, countResults) => {
            if (countErr) {
                return res.status(500).send(countErr.message);
            }
    
            const totalTransactions = countResults[0].total;
            const totalPages = Math.ceil(totalTransactions / limit);
    
            // Then, get paginated transactions
            db.query(dataQuery, params, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
    
                res.status(200).json({
                    transactions: results,
                    currentPage: page,
                    totalPages: totalPages,
                    totalTransactions: totalTransactions,
                });
            });
        });
    };

    
    // Ambil produk berdasarkan ID
    const getProductById = (req, res) => {
        const { id } = req.params;
        db.query('SELECT * FROM cr_products WHERE product_id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (results.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(200).json(results[0]);
        });
    };

    const getProductsByCategory = (req, res) => {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const offset = (page - 1) * limit;
    
        // Count total products in category
        const countQuery = 'SELECT COUNT(*) AS total FROM cr_products WHERE category = ?';
        
        // Fetch paginated products in category
        const productsQuery = `
            SELECT * FROM cr_products 
            WHERE category = ? 
            LIMIT ? OFFSET ?
        `;
    
        // Execute count query
        db.query(countQuery, [category], (countErr, countResults) => {
            if (countErr) {
                return res.status(500).send(countErr.message);
            }
    
            const totalProducts = countResults[0].total;
            const totalPages = Math.ceil(totalProducts / limit);
    
            // Execute products query
            db.query(productsQuery, [category, limit, offset], (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
    
                if (results.length === 0) {
                    return res.status(404).send('No products found for this category');
                }
    
                res.status(200).json({
                    products: results,
                    currentPage: page,
                    totalPages: totalPages,
                    totalProducts: totalProducts
                });
            });
        });
    };

    const getProductStockDetails = (req, res) => {
        const query = `
            SELECT * FROM cr_products
        `;
        db.query(query, (err, results) => {
            if (err) {
                console.error("Query Error: ", err); // Debugging untuk log error
                return res.status(500).json({
                    success: false,
                    message: 'Gagal memuat data produk, silakan coba lagi nanti.',
                    error: err.message // Tampilkan pesan error untuk debugging
                });
            }
    
            // Jika tidak ada data ditemukan
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tidak ada data produk yang ditemukan.'
                });
            }
    
            res.status(200).json({
                success: true,
                message: 'Data produk berhasil dimuat.',
                data: results
            });
        });
    };
    

    // Menyimpan file dengan pengaturan penyimpanan khusus
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = './assets/images/';
            
            // Pastikan direktori ada
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            const fileName = `${file.originalname.split('.')[0]}${fileExtension}`; // Nama file tanpa timestamp
            cb(null, fileName);
        }
    });
    
    
    // Batasan ukuran file dan tipe MIME yang diperbolehkan
    const upload = multer({ 
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // Max file size 5MB
        fileFilter: function (req, file, cb) {
            const allowedFileTypes = /jpeg|jpg|png|gif/;
            const mimetype = allowedFileTypes.test(file.mimetype);
            const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    
            if (mimetype && extname) {
                return cb(null, true);
            } else {
                return cb(new Error('Hanya gambar yang diperbolehkan'));
            }
        }
    });
    
    // Menangani unggahan file
    const uploadImage = (req, res) => {
        upload.single('image')(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // Error Multer
                return res.status(400).json({ message: 'Ukuran gambar terlalu besar' });
            } else if (err) {
                // Error lain
                return res.status(400).json({ message: err.message });
            }
            const uploadedFileName = req.file.filename;
            res.status(200).json({ message: 'Gambar berhasil diunggah', filename: uploadedFileName });
        });
    };

    // Membuat produk baru
    const createProduct = (req, res) => {
        const { product_name, category, price_per_day, stock, description, product_image } = req.body;

        if (!product_name || !category || !price_per_day || !stock || !description || !product_image) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        const query = `
            INSERT INTO cr_products (product_name, category, price_per_day, stock, description, product_image)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [product_name, category, price_per_day, stock, description, product_image], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Gagal menyimpan produk' });
            }
            res.status(201).json({ 
                message: 'Produk berhasil dibuat', 
                product_id: results.insertId 
            });
        });
    };

  // Update produk berdasarkan ID
    const updateProduct = (req, res) => {
        const { id } = req.params;
        const { product_name, category, price_per_day, stock, description, product_image } = req.body;
    
        const query = `
        UPDATE cr_products 
        SET product_name = ?, category = ?, price_per_day = ?, stock = ?, description = ?, product_image = ?
        WHERE product_id = ?
        `;
        db.query(query, [product_name, category, price_per_day, stock, description, product_image, id], (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(200).json({ message: 'Product updated successfully' });
        });
    };
  
    // Hapus produk berdasarkan ID
    const deleteProduct = (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM cr_products WHERE product_id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.status(200).json({ message: 'Product deleted successfully' });
        });
    };

    // Menambahkan item ke keranjang
    const addToCart = (req, res) => {
        const { user_id, product_id, product_name, product_price, quantity } = req.body;
    
        if (!user_id || !product_id || !product_name || !product_price || !quantity) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }
    
        // Mengecek stok produk terlebih dahulu
        const checkStockQuery = `SELECT stock FROM cr_products WHERE product_id = ?`;
        
        db.query(checkStockQuery, [product_id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
    
            if (results.length === 0) {
                return res.status(404).json({ message: 'Produk tidak ditemukan' });
            }
    
            const availableStock = results[0].stock;
    
            // Jika quantity yang diminta melebihi stok
            if (quantity > availableStock) {
                return res.status(400).json({ message: 'Stok tidak cukup' });
            }
    
            // Jika stok cukup, lanjutkan menambahkan ke keranjang
            const query = `
                INSERT INTO cr_cart (user_id, product_id, product_name, product_price, quantity)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE quantity = quantity + ?
            `;
    
            db.query(query, [user_id, product_id, product_name, product_price, quantity, quantity], (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.status(201).json({ message: 'Produk berhasil ditambahkan ke keranjang' });
            });
        });
    };
    

    // Mendapatkan item dalam keranjang untuk user tertentu
    const getCartByUser = (req, res) => {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID harus diisi' });
        }

        const query = `SELECT * FROM cr_cart WHERE user_id = ?`;
        db.query(query, [user_id], (err, results) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(200).json(results);
        });
    };
    
    // Menghapus item dari keranjang berdasarkan cart_id
    const deleteFromCart = (req, res) => {
        const { cart_id } = req.params; // Mengambil cart_id dari parameter URL

        if (!cart_id) {
            return res.status(400).json({ message: 'cart_id harus diisi' });
        }

        const query = `DELETE FROM cr_cart WHERE cart_id = ?`;

        db.query(query, [cart_id], (err, results) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Item tidak ditemukan di keranjang' });
            }

            res.status(200).json({ message: 'Item berhasil dihapus dari keranjang' });
        });
    };

    const checkoutItem = (req, res) => {
        const { selectedProducts, userId } = req.body;
    
        console.log('Data diterima dari keranjang:', { selectedProducts, userId });
    
        if (!selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada produk yang dipilih untuk checkout.' });
        }
    
        const data = { selectedProducts, userId };
    
        res.json({ 
            success: true,
            message: 'Data berhasil diteruskan.',
            redirectUrl: `http://localhost/camerarent/checkout.php?data=${encodeURIComponent(JSON.stringify(data))}`,
        });
    };

    const checkoutPayment = (req, res) => {
        const {
            user_id,
            full_name,
            email,
            phone,
            address,
            city,
            postal_code,
            pickup_method,
            payment_method,
            pickup_date,
            id_card_file,
            items,
            subtotal,
            total,
        } = req.body;
    
        // Validate all required fields
        if (!user_id || !full_name || !email || !phone || !address || !city || !postal_code || !pickup_method || !payment_method || !pickup_date || !id_card_file || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Data tidak valid!' });
        }
    
        // Parse pickup_date to a JavaScript Date object
        const pickupDate = new Date(pickup_date);
    
        // Calculate end_date based on pickup_date and items.days
        let totalDays = 0;
    
        // Sum up all days from each item
        items.forEach((item) => {
            totalDays += item.days;  // assuming item.days contains the number of days for each item
        });
    
        // Calculate end_date by adding totalDays to pickupDate
        const endDate = new Date(pickupDate);
        endDate.setDate(endDate.getDate() + totalDays);  // Add totalDays to pickupDate
    
        // Format end_date to MySQL-compatible format (YYYY-MM-DD HH:MM:SS)
        const formattedEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');
    
        // Combine product names from all items into one string with comma separator
        const productNames = items.map(item => item.product_name).join(', ');
    
        // Construct transaction query including end_date and product_names
        const transactionQuery = `
            INSERT INTO cr_transaction (
                transaction_id, user_id, full_name, email, phone, address, city, postal_code,
                pickup_method, payment_method, pickup_date, end_date, id_card_file, product_name,
                payment_status, transaction_status, total, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'processing', ?, NOW())
        `;
        
        // Insert data into database
        const transaction_id = require('crypto').randomUUID();
        db.query(
            transactionQuery,
            [
                transaction_id,
                user_id,
                full_name,
                email,
                phone,
                address,
                city,
                postal_code,
                pickup_method,
                payment_method,
                pickup_date,
                formattedEndDate, // Insert end_date here
                id_card_file,
                productNames, // Insert product_names here
                total,
            ],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
    
                // Update stok produk di cr_products setelah transaksi berhasil
                const updateStockQuery = `
                    UPDATE cr_products
                    SET stock = stock - ?
                    WHERE product_id = ?
                `;
    
                // Loop melalui items untuk mengurangi stok setiap produk
                const stockPromises = items.map((item) => {
                    return new Promise((resolve, reject) => {
                        db.query(updateStockQuery, [item.quantity, item.product_id], (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });
                });
    
                // Setelah stok diperbarui, hapus barang dari cart dan kirimkan response
                const deleteCartQuery = `DELETE FROM cr_cart WHERE cart_id = ?`;
                const cartPromises = items.map((item) => {
                    return new Promise((resolve, reject) => {
                        db.query(deleteCartQuery, [item.cart_id], (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });
                });
    
                // Tunggu hingga semua update stok dan penghapusan cart selesai
                Promise.all([...stockPromises, ...cartPromises])
                    .then(() => {
                        res.status(201).json({ success: true, message: 'Checkout berhasil!', transaction_id: transaction_id });
                    })
                    .catch((err) => {
                        res.status(500).json({ success: false, message: err.message });
                    });
            }
        );
    };
    
    
    
    const getTransactionDetails = (req, res) => {
        const { id } = req.params;
    
        const query = `
            SELECT * FROM cr_transaction 
            WHERE transaction_id = ?
        `;
        
        db.query(query, [id], (err, results) => {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: 'Database error',
                    error: err.message,
                });
            }
    
            if (results.length === 0) {
                return res.status(404).send({
                    success: false,
                    message: 'Transaction not found',
                });
            }
    
            const transaction = results[0]; // Assuming only one result with this transaction_id
            res.status(200).json({
                success: true,
                transaction: {
                    transaction_id: transaction.transaction_id,
                    user_id: transaction.user_id,
                    full_name: transaction.full_name,
                    email: transaction.email,
                    phone: transaction.phone,
                    address: transaction.address,
                    city: transaction.city,
                    postal_code: transaction.postal_code,
                    pickup_method: transaction.pickup_method,
                    payment_method: transaction.payment_method,
                    payment_status: transaction.payment_status,
                    pickup_date: transaction.pickup_date,
                    transaction_status: transaction.transaction_status,
                    id_card_file: transaction.id_card_file,
                    total: transaction.total,
                    created_at: transaction.created_at,
                },
            });
        });
    };

    
    const createPayment = (req, res) => {
        const { transaction_id, payment_proof, amount, status } = req.body;
    
        // Validasi input
        if (!transaction_id || !payment_proof || !amount || !status) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }
    
        // Buat payment_id unik
        const payment_id = require('crypto').randomUUID();
    
        // Query untuk insert ke cr_payment
        const insertPaymentQuery = `
            INSERT INTO cr_payment (payment_id, transaction_id, payment_proof, amount, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
    
        // Eksekusi insert ke cr_payment
        db.query(insertPaymentQuery, [payment_id, transaction_id, payment_proof, amount, status], (err, results) => {
            if (err) {
                console.error('Database Error (Insert Payment):', err);
                return res.status(500).json({ message: 'Gagal menyimpan pembayaran' });
            }
    
            // Query untuk update cr_transaction
            const updateTransactionQuery = `
                UPDATE cr_transaction 
                SET payment_status = 'paid', updated_at = NOW()
                WHERE transaction_id = ?
            `;
    
            // Eksekusi update ke cr_transaction
            db.query(updateTransactionQuery, [transaction_id], (updateErr, updateResults) => {
                if (updateErr) {
                    console.error('Database Error (Update Transaction):', updateErr);
                    return res.status(500).json({ message: 'Pembayaran berhasil disimpan, tetapi gagal memperbarui status transaksi' });
                }
    
                // Respon sukses dengan payment_id
                res.status(201).json({
                    message: 'Pembayaran berhasil disimpan dan status transaksi diperbarui',
                    payment_id: payment_id
                });
            });
        });
    };
    
    
    const updateTransactionStatus = (req, res) => {
        const { id } = req.params; // Transaction ID
        const { status } = req.body; // New status
    
        // Validate status
        const validStatuses = ['processing', 'delivered', 'completed', 'canceled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).send('Invalid transaction status');
        }
    
        const query = `
            UPDATE cr_transaction 
            SET transaction_status = ?
            WHERE transaction_id = ?
        `;
    
        db.query(query, [status, id], (err, results) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            if (results.affectedRows === 0) {
                return res.status(404).send('Transaction not found');
            }
            res.status(200).json({ message: 'Transaction status updated successfully' });
        });
    };

    
    const getTransactionData = (req, res) => {
        const query = `
            SELECT COUNT(*) AS total_transactions, SUM(total) AS total_revenue
            FROM cr_transaction
        `;
        db.query(query, (err, results) => {
            if (err) {
                console.error("Query Error: ", err); // Log kesalahan query
                return res.status(500).json({ success: false, message: err.message });
            }
            console.log("Query Results: ", results); // Log hasil query
            const { total_transactions, total_revenue } = results[0];
            res.status(200).json({
                success: true,
                data: {
                    total_transactions,
                    total_revenue: total_revenue || 0 // Handle NULL case
                }
            });
        });
    }
    
    
    
  
    module.exports = {
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
    };