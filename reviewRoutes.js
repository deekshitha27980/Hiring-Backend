const express = require('express');
const pool = require('./db');
const auth = require('./authMiddleware');
const router = express.Router();

// Add review (client only, after completed booking)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can review' });
  const { professional_id, booking_id, rating, comment } = req.body;
  try {
    // Verify booking is completed and belongs to this client
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id=$1 AND client_id=$2 AND status=$3',
      [booking_id, req.user.id, 'completed']
    );
    if (!booking.rows.length) return res.status(400).json({ message: 'No completed booking found' });

    // Check not already reviewed
    const existing = await pool.query('SELECT id FROM reviews WHERE booking_id=$1', [booking_id]);
    if (existing.rows.length) return res.status(400).json({ message: 'Already reviewed' });

    const result = await pool.query(
      'INSERT INTO reviews (client_id, professional_id, booking_id, rating, comment) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, professional_id, booking_id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get reviews for a professional
router.get('/professional/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name AS client_name, u.avatar AS client_avatar
      FROM reviews r
      JOIN users u ON u.id = r.client_id
      WHERE r.professional_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
