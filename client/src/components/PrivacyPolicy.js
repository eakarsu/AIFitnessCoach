import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="page-container">
      <div className="content" style={{maxWidth:'800px'}}>
        <h2 className="page-title" style={{marginBottom:'2rem'}}>Privacy Policy</h2>
        <div className="card" style={{cursor:'default',lineHeight:1.8,color:'rgba(255,255,255,0.8)'}}>
          <h3 style={{color:'#667eea',marginBottom:'1rem'}}>1. Information We Collect</h3>
          <p>We collect fitness data you provide including workouts, running sessions, golf swing metrics, team formations, and recovery plans. We also collect your email, name, and profile information.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>2. How We Use Your Data</h3>
          <p>Your data is used to provide personalized AI-powered fitness coaching, track your progress, and improve our services. We use AI analysis to generate workout plans and provide training recommendations.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>3. Data Storage & Security</h3>
          <p>Your data is stored securely in encrypted databases. We use industry-standard security measures including HTTPS, password hashing, and JWT authentication.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>4. Third-Party Services</h3>
          <p>We use OpenRouter API for AI analysis. Your fitness data may be sent to AI models for analysis purposes. We do not sell your personal data to third parties.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>5. Your Rights</h3>
          <p>You can export all your data, update your profile, or delete your account at any time from the Settings page.</p>
          <h3 style={{color:'#667eea',margin:'1.5rem 0 1rem'}}>6. Contact</h3>
          <p>For privacy concerns, please use the Contact page or send feedback through the app.</p>
          <p style={{marginTop:'2rem',color:'rgba(255,255,255,0.4)',fontSize:'0.85rem'}}>Last updated: February 2026</p>
        </div>
      </div>
    </div>
  );
}
export default PrivacyPolicy;
