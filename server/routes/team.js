const express = require('express');
const router = express.Router();

// Get all team formations (with search & pagination)
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM team_formations';
    let countQuery = 'SELECT COUNT(*) FROM team_formations';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' WHERE (team_name ILIKE $1 OR sport ILIKE $1 OR formation ILIKE $1 OR strategy ILIKE $1)';
      countQuery += ' WHERE (team_name ILIKE $1 OR sport ILIKE $1 OR formation ILIKE $1 OR strategy ILIKE $1)';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    console.error('Error fetching team formations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('SELECT * FROM team_formations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { team_name, sport, formation, players, strategy, notes, user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO team_formations (user_id, team_name, sport, formation, players, strategy, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [user_id || 1, team_name, sport, formation, JSON.stringify(players), strategy, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { team_name, sport, formation, players, strategy, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE team_formations SET team_name=$1, sport=$2, formation=$3, players=$4, strategy=$5, notes=$6 WHERE id=$7 RETURNING *',
      [team_name, sport, formation, JSON.stringify(players), strategy, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query('DELETE FROM team_formations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
