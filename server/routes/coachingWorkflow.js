const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { validateIntake, buildCoachingDraft, buildSessionAdaptation } = require('../domain/coachingWorkflow');

const router = express.Router();
router.use(authenticateToken);

router.post('/intakes', async (req, res) => {
  const errors = validateIntake(req.body);
  if (errors.length) return res.status(400).json({ error: 'validation_failed', details: errors });
  const draft = buildCoachingDraft(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prior = await client.query(
      'SELECT p.* FROM coaching_intakes i JOIN coaching_plans p ON p.intake_id=i.id WHERE i.user_id=$1 AND i.client_event_id=$2',
      [req.user.id, req.body.client_event_id]
    );
    if (prior.rows.length) { await client.query('ROLLBACK'); return res.json({ plan: prior.rows[0], idempotent_replay: true }); }
    const intake = (await client.query(
      `INSERT INTO coaching_intakes(user_id,client_event_id,goal,constraints,consent,provenance)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, req.body.client_event_id, req.body.goal, req.body.constraints, req.body.consent, req.body.provenance]
    )).rows[0];
    const plan = (await client.query(
      `INSERT INTO coaching_plans(intake_id,user_id,ruleset_version,status,professional_review_required,decision)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [intake.id, req.user.id, draft.ruleset_version, draft.status, draft.professional_review_required, draft]
    )).rows[0];
    await client.query('INSERT INTO coaching_audit_events(user_id,plan_id,action,details) VALUES($1,$2,$3,$4)', [req.user.id, plan.id, 'plan_drafted', { status: draft.status }]);
    await client.query('COMMIT');
    res.status(201).json({ intake, plan, draft, warning: 'No exercise, wearable, reminder, or external action was scheduled or executed.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('coaching intake failed:', error);
    res.status(500).json({ error: 'coaching_workflow_failed' });
  } finally { client.release(); }
});

router.post('/plans/:id/review', async (req, res) => {
  const decision = req.body?.decision;
  if (!['accept', 'reject'].includes(decision)) return res.status(400).json({ error: 'decision must be accept or reject' });
  const isCoach = ['coach', 'admin'].includes(req.user.role);
  const nextStatus = decision === 'reject' ? 'rejected' : isCoach ? 'coach_approved' : 'user_accepted';
  const result = await pool.query(
    `UPDATE coaching_plans SET status=$1,reviewed_by=$2,reviewed_at=NOW(),updated_at=NOW()
     WHERE id=$3 AND user_id=$2 AND status='draft' AND professional_review_required=FALSE RETURNING *`,
    [nextStatus, req.user.id, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'reviewable_plan_not_found' });
  await pool.query('INSERT INTO coaching_audit_events(user_id,plan_id,action,details) VALUES($1,$2,$3,$4)', [req.user.id, req.params.id, 'plan_reviewed', { decision, role: req.user.role }]);
  res.json({ plan: result.rows[0], warning: 'Review changes record state only; it does not schedule or execute activity.' });
});

router.post('/plans/:id/sessions', async (req, res) => {
  if (!req.body?.client_event_id || !req.body?.occurred_at) return res.status(400).json({ error: 'client_event_id and occurred_at are required' });
  const adaptation = buildSessionAdaptation(req.body);
  const result = await pool.query(
    `INSERT INTO coaching_session_logs(plan_id,user_id,client_event_id,occurred_at,feedback,adaptation)
     SELECT p.id,$1,$2,$3,$4,$5 FROM coaching_plans p
     WHERE p.id=$6 AND p.user_id=$1 AND p.status IN ('user_accepted','coach_approved')
     ON CONFLICT(user_id,client_event_id) DO UPDATE SET client_event_id=EXCLUDED.client_event_id RETURNING *`,
    [req.user.id, req.body.client_event_id, req.body.occurred_at, req.body, adaptation, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'active_plan_not_found' });
  if (adaptation.status === 'plan_paused_for_review') await pool.query("UPDATE coaching_plans SET status='paused',updated_at=NOW() WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
  await pool.query('INSERT INTO coaching_audit_events(user_id,plan_id,action,details) VALUES($1,$2,$3,$4)', [req.user.id, req.params.id, 'session_feedback_recorded', adaptation]);
  res.status(201).json({ session: result.rows[0], adaptation, warning: 'Adaptation is proposed only and was not automatically applied.' });
});

module.exports = router;
