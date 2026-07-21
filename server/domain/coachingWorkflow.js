const RULESET_VERSION = 'fitness-coaching-safety-2026-07-18';
const GOAL_TYPES = new Set(['general_fitness', 'mobility', 'strength_foundation', 'endurance_foundation']);

function validateIntake(input = {}) {
  const errors = [];
  if (!input.client_event_id || typeof input.client_event_id !== 'string') errors.push('client_event_id is required');
  if (!input.goal || !GOAL_TYPES.has(input.goal.type)) errors.push(`goal.type must be one of ${[...GOAL_TYPES].join(', ')}`);
  const days = Number(input.goal?.days_per_week);
  if (!Number.isInteger(days) || days < 1 || days > 6) errors.push('goal.days_per_week must be an integer from 1 to 6');
  if (input.consent?.coaching_support !== true) errors.push('explicit coaching_support consent is required');
  if (!input.provenance?.source || !input.provenance?.captured_at) errors.push('provenance.source and provenance.captured_at are required');
  if (!Array.isArray(input.constraints?.accessibility_needs)) errors.push('constraints.accessibility_needs must be an array');
  return errors;
}

function screenRisk(constraints = {}) {
  const emergencySignals = [];
  if (constraints.chest_pain === true) emergencySignals.push('chest_pain');
  if (constraints.fainting === true) emergencySignals.push('fainting');
  if (constraints.severe_breathing_difficulty === true) emergencySignals.push('severe_breathing_difficulty');
  if (constraints.new_neurologic_symptoms === true) emergencySignals.push('new_neurologic_symptoms');
  const professionalSignals = [];
  if (Number(constraints.pain_0_10) >= 7) professionalSignals.push('severe_pain');
  if (constraints.recent_surgery_or_injury === true) professionalSignals.push('recent_surgery_or_injury');
  if (constraints.professional_clearance_required === true) professionalSignals.push('clearance_required');
  return { emergencySignals, professionalSignals };
}

function buildCoachingDraft(input) {
  const risk = screenRisk(input.constraints);
  const emergency = risk.emergencySignals.length > 0;
  const professionalReviewRequired = risk.professionalSignals.length > 0;
  const status = emergency ? 'emergency_boundary' : professionalReviewRequired ? 'professional_review_required' : 'draft';
  const days = Number(input.goal.days_per_week);
  const sessions = emergency || professionalReviewRequired ? [] : Array.from({ length: days }, (_, index) => ({
    sequence: index + 1,
    focus: index % 3 === 0 ? 'foundational_movement' : index % 3 === 1 ? 'low_intensity_conditioning' : 'mobility_and_recovery',
    effort: 'conversational_or_easy',
    stop_conditions: ['pain_increase', 'dizziness', 'chest_pain', 'unusual_shortness_of_breath'],
  }));
  return {
    ruleset_version: RULESET_VERSION,
    status,
    goal_type: input.goal.type,
    risk,
    professional_review_required: professionalReviewRequired,
    emergency_message: emergency ? 'Stop activity and seek local emergency help now. This software does not assess or diagnose emergencies.' : null,
    sessions,
    accessibility_needs: input.constraints.accessibility_needs,
    execution: { scheduled: false, wearable_written: false, message_sent: false },
    disclaimer: 'Educational coaching draft only; not medical advice, diagnosis, treatment, or professional clearance.',
  };
}

function buildSessionAdaptation(input = {}) {
  const pain = Number(input.pain_0_10);
  const stopped = input.stopped_for_safety === true || pain >= 7;
  return {
    ruleset_version: RULESET_VERSION,
    status: stopped ? 'plan_paused_for_review' : 'feedback_recorded',
    proposed_change: stopped ? 'pause_and_request_professional_review' : input.perceived_effort_0_10 >= 8 ? 'reduce_next_session_volume' : 'no_automatic_change',
    automatically_applied: false,
  };
}

module.exports = { RULESET_VERSION, validateIntake, screenRisk, buildCoachingDraft, buildSessionAdaptation };
