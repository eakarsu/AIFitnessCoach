const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|mp4|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// Get all uploads
router.get('/', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      'SELECT * FROM file_uploads WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching uploads:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload file
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  const pool = req.app.locals.pool;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { category, notes } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO file_uploads (user_id, filename, original_name, mime_type, size, category, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, category || 'other', notes || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving upload:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete upload
router.delete('/:id', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const file = await pool.query('SELECT * FROM file_uploads WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (file.rows.length === 0) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(uploadsDir, file.rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM file_uploads WHERE id = $1', [req.params.id]);
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Error deleting upload:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
