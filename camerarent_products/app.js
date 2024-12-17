const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const productRoutes = require('./routes/products');
const connection = require('./connection/database');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT;

app.use('/products', productRoutes);
app.use('/products/assets/images', express.static(path.join(__dirname, 'assets/images')));
app.listen(PORT, () => console.log(`Products Services is running`));