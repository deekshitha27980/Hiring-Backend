require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db'); // initialize DB and create tables

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./authRoutes'));
app.use('/api/professionals', require('./professionalRoutes'));
app.use('/api/bookings', require('./bookingRoutes'));
app.use('/api/reviews', require('./reviewRoutes'));
app.use('/api/payments', require('./paymentRoutes'));

app.get('/', (req, res) => res.json({ message: 'ProConnect API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
