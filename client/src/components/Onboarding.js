import React, { useState } from 'react';
import axios from 'axios';

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ height: '', weight: '', age: '', fitness_level: 'Intermediate', gender: '', goals: '' });

  const handleFinish = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/profile', { ...data, onboarding_complete: true }, { headers: { Authorization: `Bearer ${token}` } });
      onComplete();
    } catch (err) { console.error(err); onComplete(); }
  };

  const steps = [
    <div key={0} style={{textAlign:'center'}}>
      <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🏋️</div>
      <h2 style={{color:'white',marginBottom:'1rem',fontSize:'1.8rem'}}>Welcome to AI Fitness Coach!</h2>
      <p style={{color:'rgba(255,255,255,0.6)',fontSize:'1.1rem',lineHeight:1.6}}>Let's set up your profile so we can personalize your fitness experience.</p>
    </div>,
    <div key={1}>
      <h3 style={{color:'white',marginBottom:'1.5rem'}}>Your Body Metrics</h3>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Height (cm)</label><input className="form-input" type="number" value={data.height} onChange={e=>setData({...data,height:e.target.value})} placeholder="e.g. 180" /></div>
        <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" value={data.weight} onChange={e=>setData({...data,weight:e.target.value})} placeholder="e.g. 75" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Age</label><input className="form-input" type="number" value={data.age} onChange={e=>setData({...data,age:e.target.value})} placeholder="e.g. 25" /></div>
        <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={data.gender} onChange={e=>setData({...data,gender:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></div>
      </div>
    </div>,
    <div key={2}>
      <h3 style={{color:'white',marginBottom:'1.5rem'}}>Fitness Level & Goals</h3>
      <div className="form-group"><label className="form-label">Fitness Level</label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem'}}>
          {['Beginner','Intermediate','Advanced','Elite'].map(l=>(
            <button key={l} type="button" onClick={()=>setData({...data,fitness_level:l})} className={`btn ${data.fitness_level===l?'btn-primary':'btn-secondary'}`} style={{padding:'0.75rem'}}>{l}</button>
          ))}
        </div>
      </div>
      <div className="form-group"><label className="form-label">What are your fitness goals?</label><textarea className="form-textarea" value={data.goals} onChange={e=>setData({...data,goals:e.target.value})} placeholder="e.g. Build muscle, lose weight, run a marathon..." /></div>
    </div>,
    <div key={3} style={{textAlign:'center'}}>
      <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🎉</div>
      <h2 style={{color:'white',marginBottom:'1rem'}}>You're All Set!</h2>
      <p style={{color:'rgba(255,255,255,0.6)',fontSize:'1.1rem'}}>Your profile is ready. Start exploring AI-powered fitness tools!</p>
    </div>
  ];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div className="card" style={{maxWidth:'600px',width:'100%',padding:'2.5rem',cursor:'default'}}>
        <div style={{display:'flex',justifyContent:'center',gap:'0.5rem',marginBottom:'2rem'}}>
          {steps.map((_,i)=><div key={i} style={{width:'40px',height:'4px',borderRadius:'2px',background:i<=step?'#667eea':'rgba(255,255,255,0.1)'}}></div>)}
        </div>
        {steps[step]}
        <div style={{display:'flex',justifyContent:'space-between',marginTop:'2rem'}}>
          <button onClick={()=>step>0?setStep(step-1):null} className="btn btn-secondary" style={{visibility:step===0?'hidden':'visible'}}>Back</button>
          {step < steps.length - 1 ? (
            <button onClick={()=>setStep(step+1)} className="btn btn-primary">Next</button>
          ) : (
            <button onClick={handleFinish} className="btn btn-success">Get Started</button>
          )}
        </div>
      </div>
    </div>
  );
}
export default Onboarding;
