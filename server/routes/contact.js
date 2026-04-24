const express = require('express');
const router = express.Router();

// Contact form submission (public endpoint)
router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Save to feedback table with user_id null for anonymous
    await pool.query(
      'INSERT INTO feedback (type, subject, message, status) VALUES ($1, $2, $3, $4)',
      ['contact', `[Contact] ${subject}`, `From: ${name} (${email})\n\n${message}`, 'open']
    );

    console.log(`Contact form from ${name} (${email}): ${subject}`);
    res.json({ message: 'Message sent successfully. We will get back to you soon!' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
