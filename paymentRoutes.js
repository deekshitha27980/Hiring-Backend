const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('./db');
const auth = require('./authMiddleware');
const router = express.Router();

// Create payment intent
router.post('/create-intent', auth, async (req, res) => {
  const { booking_id, amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      metadata: { booking_id: String(booking_id) },
    });

    await pool.query(
      'INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, status) VALUES ($1,$2,$3,$4)',
      [booking_id, paymentIntent.id, amount, 'pending']
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Confirm payment (webhook or manual confirm)
router.post('/confirm', auth, async (req, res) => {
  const { payment_intent_id } = req.body;
  try {
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.status === 'succeeded') {
      await pool.query(
        'UPDATE payments SET status=$1 WHERE stripe_payment_intent_id=$2',
        ['succeeded', payment_intent_id]
      );
      // Mark booking as accepted after payment
      await pool.query(
        `UPDATE bookings SET status='accepted' WHERE id=$1`,
        [intent.metadata.booking_id]
      );
      return res.json({ message: 'Payment confirmed' });
    }
    res.status(400).json({ message: 'Payment not completed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payment status for a booking
router.get('/booking/:booking_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE booking_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.params.booking_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
