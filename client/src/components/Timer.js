import React, { useState, useRef, useEffect } from 'react';

function Timer() {
  const [mode, setMode] = useState('stopwatch');
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const [countdownStart, setCountdownStart] = useState(300);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (mode === 'countdown') {
            if (prev <= 0) { setRunning(false); return 0; }
            return prev - 10;
          }
          return prev + 10;
        });
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(centis).padStart(2,'0')}`;
  };

  const handleReset = () => { setRunning(false); setTime(mode === 'countdown' ? countdownStart * 1000 : 0); setLaps([]); };
  const handleLap = () => { if (running && mode === 'stopwatch') setLaps([...laps, time]); };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header"><div><h2 className="page-title">⏱️ Timer</h2><p className="page-subtitle">Stopwatch & countdown timer</p></div></div>
        <div style={{maxWidth:'500px',margin:'0 auto'}}>
          <div className="card" style={{cursor:'default',textAlign:'center',padding:'2rem'}}>
            <div style={{display:'flex',justifyContent:'center',gap:'1rem',marginBottom:'2rem'}}>
              <button onClick={()=>{setMode('stopwatch');handleReset();setTime(0);}} className={`btn ${mode==='stopwatch'?'btn-primary':'btn-secondary'}`}>Stopwatch</button>
              <button onClick={()=>{setMode('countdown');handleReset();setTime(countdownStart*1000);}} className={`btn ${mode==='countdown'?'btn-primary':'btn-secondary'}`}>Countdown</button>
            </div>
            {mode === 'countdown' && !running && time === countdownStart * 1000 && (
              <div style={{marginBottom:'1.5rem'}}>
                <label className="form-label">Set Duration (seconds)</label>
                <input type="number" className="form-input" style={{textAlign:'center',maxWidth:'200px',margin:'0 auto'}} value={countdownStart} onChange={e=>{setCountdownStart(parseInt(e.target.value)||0);setTime((parseInt(e.target.value)||0)*1000);}} />
              </div>
            )}
            <div style={{fontSize:'4rem',fontWeight:700,fontFamily:'monospace',color:'#667eea',marginBottom:'2rem',textShadow:'0 0 30px rgba(102,126,234,0.3)'}}>{formatTime(time)}</div>
            <div style={{display:'flex',justifyContent:'center',gap:'1rem'}}>
              <button onClick={()=>setRunning(!running)} className={`btn ${running?'btn-danger':'btn-success'}`} style={{minWidth:'120px'}}>{running ? 'Stop' : 'Start'}</button>
              {mode === 'stopwatch' && <button onClick={handleLap} className="btn btn-secondary" disabled={!running}>Lap</button>}
              <button onClick={handleReset} className="btn btn-secondary">Reset</button>
            </div>
          </div>
          {laps.length > 0 && (
            <div className="card" style={{cursor:'default',marginTop:'1.5rem'}}>
              <h3 className="detail-section-title">Laps</h3>
              {laps.map((lap, i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.8)'}}>
                  <span>Lap {i + 1}</span>
                  <span style={{fontFamily:'monospace',color:'#667eea'}}>{formatTime(lap)}</span>
                  {i > 0 && <span style={{fontFamily:'monospace',color:'#38ef7d'}}>+{formatTime(lap - laps[i-1])}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Timer;
