const express = require('express');
const pool = require('./db');
const auth = require('./authMiddleware');
const router = express.Router();

// Create booking (client only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can book' });
  const { professional_id, description, scheduled_date, total_amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO bookings (client_id, professional_id, description, scheduled_date, total_amount) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, professional_id, description, scheduled_date, total_amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my bookings (client sees their bookings, professional sees bookings for them)
router.get('/my', auth, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'client') {
      result = await pool.query(`
        SELECT b.*, u.name AS professional_name, p.title, p.category
        FROM bookings b
        JOIN professionals p ON p.id = b.professional_id
        JOIN users u ON u.id = p.user_id
        WHERE b.client_id = $1 ORDER BY b.created_at DESC
      `, [req.user.id]);
    } else {
      result = await pool.query(`
        SELECT b.*, u.name AS client_name, u.email AS client_email
        FROM bookings b
        JOIN users u ON u.id = b.client_id
        JOIN professionals p ON p.user_id = $1 AND p.id = b.professional_id
        ORDER BY b.created_at DESC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update booking status (professional only)
router.patch('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'professional') return res.status(403).json({ message: 'Forbidden' });
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
