const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIntake, buildCoachingDraft, buildSessionAdaptation } = require('../domain/coachingWorkflow');

const base = {
  client_event_id: 'fit-1', goal: { type: 'general_fitness', days_per_week: 3 },
  consent: { coaching_support: true },
  constraints: { pain_0_10: 1, accessibility_needs: ['seated_option'] },
  provenance: { source: 'user_entry', captured_at: '2026-07-18T12:00:00Z' },
};

test('creates a conservative non-executing plan with accessibility context', () => {
  assert.deepEqual(validateIntake(base), []);
  const draft = buildCoachingDraft(base);
  assert.equal(draft.status, 'draft');
  assert.equal(draft.sessions.length, 3);
  assert.equal(draft.execution.scheduled, false);
  assert.deepEqual(draft.accessibility_needs, ['seated_option']);
});

test('emergency and severe pain inputs block planning and unsafe adaptation', () => {
  const emergency = buildCoachingDraft({ ...base, constraints: { ...base.constraints, chest_pain: true } });
  assert.equal(emergency.status, 'emergency_boundary');
  assert.equal(emergency.sessions.length, 0);
  const adaptation = buildSessionAdaptation({ pain_0_10: 8 });
  assert.equal(adaptation.status, 'plan_paused_for_review');
  assert.equal(adaptation.automatically_applied, false);
});
