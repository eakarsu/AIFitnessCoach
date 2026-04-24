import React from 'react';

function TermsOfService() {
  return (
    <div className="page-container">
      <div className="content" style={{maxWidth:'800px'}}>
        <h2 className="page-title" style={{marginBottom:'2rem'}}>Terms of Service</h2>
        <div className="card" style={{cursor:'default',lineHeight:1.8,color:'rgba(255,255,255,0.8)'}}>
          <h3 style={{color:'#667eea',marginBottom:'1rem'}}>1. Acceptance of Terms</h3>
          <p>By using AI Fitness Coach, you agree to these terms of service. If you do not agree, please do not use the application.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>2. Service Description</h3>
          <p>AI Fitness Coach provides AI-powered fitness coaching, workout generation, golf swing analysis, running coaching, team formation optimization, and recovery planning.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>3. Medical Disclaimer</h3>
          <p>AI Fitness Coach is not a substitute for professional medical advice. Always consult a healthcare provider before starting any new exercise program. AI-generated recommendations are for informational purposes only.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>4. User Responsibilities</h3>
          <p>You are responsible for maintaining the security of your account credentials. You agree not to misuse the service or attempt to access unauthorized data.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>5. Limitation of Liability</h3>
          <p>AI Fitness Coach is provided "as is" without warranties. We are not liable for any injuries, damages, or losses resulting from use of AI-generated fitness recommendations.</p>
          <p style={{marginTop:'2rem',color:'rgba(255,255,255,0.4)',fontSize:'0.85rem'}}>Last updated: February 2026</p>
        </div>
      </div>
    </div>
  );
}
export default TermsOfService;
