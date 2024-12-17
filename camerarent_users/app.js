const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');
const connection = require('./connection/database')
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT;

app.use('/users', userRoutes);
app.listen(PORT, () => console.log(`Users Services is running`));