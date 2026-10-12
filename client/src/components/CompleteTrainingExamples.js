import React from 'react';
export default function CompleteTrainingExamples({ onFill, disabled }) {
  return <section className="ai-preset-bar" aria-label="Complete training examples"><div><strong>Fill all editable AI fields</strong><p>Three complete fictional scenarios include optional inputs. Existing health history, symptoms, restrictions and selected team remain in place. Review all drafts before generating.</p></div><div className="ai-actions">{['Balanced week', 'Progressive plan', 'Recovery focus'].map((label, index) => <button key={label} className="btn btn-secondary" type="button" disabled={disabled} onClick={() => onFill(index)}>{label}</button>)}</div></section>;
}
