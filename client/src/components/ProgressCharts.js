import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

function ProgressCharts() {
  const [stats, setStats] = useState(null);
  const [runningData, setRunningData] = useState([]);
  const [golfData, setGolfData] = useState([]);
  const [workoutData, setWorkoutData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('/api/progress/stats', { headers }),
      axios.get('/api/progress/running', { headers }),
      axios.get('/api/progress/golf', { headers }),
      axios.get('/api/progress/workouts', { headers })
    ]).then(([s, r, g, w]) => {
      setStats(s.data);
      setRunningData(r.data.map(d => ({ ...d, distance: parseFloat(d.distance), created_at: new Date(d.created_at).toLocaleDateString() })));
      setGolfData(g.data.map(d => ({ ...d, swing_speed: parseFloat(d.swing_speed), total_distance: parseFloat(d.total_distance), created_at: new Date(d.created_at).toLocaleDateString() })));
      setWorkoutData(w.data.map(d => ({ ...d, count: parseInt(d.count), total_calories: parseInt(d.total_calories) || 0, week: new Date(d.week).toLocaleDateString() })));
    }).catch(err => console.error(err));
  }, []);

  const chartTooltipStyle = { backgroundColor: 'rgba(15,15,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header"><div><h2 className="page-title">📈 Progress</h2><p className="page-subtitle">Track your fitness journey</p></div></div>
        {stats && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
            {[{label:'Workouts',value:stats.workouts?.count||0,icon:'🏋️'},{label:'Runs',value:stats.running?.count||0,icon:'🏃'},{label:'Golf Swings',value:stats.golf?.count||0,icon:'⛳'},{label:'Teams',value:stats.teams?.count||0,icon:'⚽'},{label:'Recovery Plans',value:stats.recovery?.count||0,icon:'💤'}].map(s=>(
              <div key={s.label} className="card" style={{cursor:'default',textAlign:'center'}}>
                <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{s.icon}</div>
                <div style={{fontSize:'1.8rem',fontWeight:700,color:'#667eea'}}>{s.value}</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:'0.85rem'}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{display:'grid',gap:'1.5rem'}}>
          {runningData.length > 0 && (
            <div className="card" style={{cursor:'default',padding:'1.5rem'}}>
              <h3 className="detail-section-title">Running Distance Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={runningData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis dataKey="created_at" stroke="rgba(255,255,255,0.5)" fontSize={12} /><YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} /><Tooltip contentStyle={chartTooltipStyle} /><Line type="monotone" dataKey="distance" stroke="#667eea" strokeWidth={2} dot={{fill:'#667eea'}} name="Distance (km)" /><Line type="monotone" dataKey="heart_rate_avg" stroke="#ff416c" strokeWidth={2} dot={{fill:'#ff416c'}} name="Avg HR" /></LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {golfData.length > 0 && (
            <div className="card" style={{cursor:'default',padding:'1.5rem'}}>
              <h3 className="detail-section-title">Golf Swing Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={golfData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis dataKey="created_at" stroke="rgba(255,255,255,0.5)" fontSize={12} /><YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} /><Tooltip contentStyle={chartTooltipStyle} /><Legend /><Line type="monotone" dataKey="swing_speed" stroke="#38ef7d" strokeWidth={2} name="Swing Speed" /><Line type="monotone" dataKey="total_distance" stroke="#f093fb" strokeWidth={2} name="Total Distance" /></LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {workoutData.length > 0 && (
            <div className="card" style={{cursor:'default',padding:'1.5rem'}}>
              <h3 className="detail-section-title">Weekly Workout Frequency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workoutData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={12} /><YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="count" fill="#667eea" name="Workouts" radius={[4,4,0,0]} /><Bar dataKey="total_calories" fill="#38ef7d" name="Calories" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ProgressCharts;
