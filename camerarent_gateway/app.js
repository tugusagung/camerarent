const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.GATEWAY_PORT;
const USERS_SERVICE = process.env.USERS_SERVICE_URL;
const PRODUCTS_SERVICE = process.env.PRODUCTS_SERVICE_URL;


app.use('/users', createProxyMiddleware({ target: USERS_SERVICE, changeOrigin: true }));
app.use('/products', createProxyMiddleware({ target: PRODUCTS_SERVICE, changeOrigin: true }));


app.listen(PORT, () => console.log(`Camera Rent Gateway is running`));