const express = require('express');
const pool = require('./db');
const auth = require('./authMiddleware');
const router = express.Router();

// Get all professionals with search & filter
router.get('/', async (req, res) => {
  const { category, location, min_rate, max_rate, search } = req.query;
  let query = `
    SELECT p.*, u.name, u.email, u.avatar,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(r.id) AS review_count
    FROM professionals p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN reviews r ON r.professional_id = p.id
    WHERE p.is_available = true
  `;
  const params = [];
  let i = 1;

  if (category) { query += ` AND p.category ILIKE $${i++}`; params.push(`%${category}%`); }
  if (location) { query += ` AND p.location ILIKE $${i++}`; params.push(`%${location}%`); }
  if (min_rate) { query += ` AND p.hourly_rate >= $${i++}`; params.push(min_rate); }
  if (max_rate) { query += ` AND p.hourly_rate <= $${i++}`; params.push(max_rate); }
  if (search) { query += ` AND (u.name ILIKE $${i} OR p.title ILIKE $${i} OR p.category ILIKE $${i})`; params.push(`%${search}%`); i++; }

  query += ' GROUP BY p.id, u.name, u.email, u.avatar ORDER BY avg_rating DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single professional
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name, u.email, u.avatar,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(r.id) AS review_count
      FROM professionals p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN reviews r ON r.professional_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, u.name, u.email, u.avatar
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update professional profile (professional only)
router.put('/profile', auth, async (req, res) => {
  if (req.user.role !== 'professional') return res.status(403).json({ message: 'Forbidden' });
  const { title, bio, category, skills, hourly_rate, location, experience_years, is_available } = req.body;
  try {
    const result = await pool.query(`
      UPDATE professionals SET title=$1, bio=$2, category=$3, skills=$4,
        hourly_rate=$5, location=$6, experience_years=$7, is_available=$8
      WHERE user_id=$9 RETURNING *
    `, [title, bio, category, skills, hourly_rate, location, experience_years, is_available, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my professional profile
router.get('/profile/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM professionals WHERE user_id=$1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
