import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';

function CalendarView() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [workouts, running, recovery] = await Promise.all([
          axios.get('/api/workouts'),
          axios.get('/api/running'),
          axios.get('/api/recovery')
        ]);
        const all = [
          ...(workouts.data.data || workouts.data).map(w => ({ ...w, eventType: 'workout', icon: '🏋️' })),
          ...(running.data.data || running.data).map(r => ({ ...r, eventType: 'running', icon: '🏃' })),
          ...(recovery.data.data || recovery.data).map(r => ({ ...r, eventType: 'recovery', icon: '💤' })),
        ];
        setEvents(all);
      } catch (err) { console.error(err); }
    };
    fetchEvents();
  }, []);

  const onDateChange = (d) => {
    setDate(d);
    const dateStr = d.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.created_at && e.created_at.split('T')[0] === dateStr);
    setSelectedDateEvents(dayEvents);
  };

  const tileContent = ({ date: d }) => {
    const dateStr = d.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.created_at && e.created_at.split('T')[0] === dateStr);
    if (dayEvents.length === 0) return null;
    return <div style={{display:'flex',justifyContent:'center',gap:'2px',marginTop:'2px'}}>{dayEvents.slice(0,3).map((e,i) => <span key={i} style={{fontSize:'0.5rem'}}>{e.icon}</span>)}</div>;
  };

  return (
    <div className="page-container">
      <div className="content">
        <div className="page-header"><div><h2 className="page-title">📅 Calendar</h2><p className="page-subtitle">View your activity schedule</p></div></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
          <div className="card" style={{cursor:'default',padding:'1.5rem'}}>
            <style>{`
              .react-calendar { width:100%; background:transparent; border:none; color:white; font-family:inherit; }
              .react-calendar__tile { color:rgba(255,255,255,0.8); border-radius:8px; padding:0.75em 0.5em; }
              .react-calendar__tile:hover { background:rgba(102,126,234,0.2); }
              .react-calendar__tile--active { background:linear-gradient(135deg,#667eea,#764ba2) !important; color:white !important; }
              .react-calendar__tile--now { background:rgba(255,255,255,0.1); }
              .react-calendar__navigation button { color:white; font-size:1rem; }
              .react-calendar__navigation button:hover { background:rgba(255,255,255,0.1); }
              .react-calendar__month-view__weekdays { color:rgba(255,255,255,0.5); font-size:0.8rem; }
              .react-calendar__month-view__weekdays abbr { text-decoration:none; }
            `}</style>
            <Calendar onChange={onDateChange} value={date} tileContent={tileContent} />
          </div>
          <div className="card" style={{cursor:'default',padding:'1.5rem'}}>
            <h3 className="detail-section-title">Events for {date.toLocaleDateString()}</h3>
            {selectedDateEvents.length === 0 ? (
              <p style={{color:'rgba(255,255,255,0.5)',textAlign:'center',padding:'2rem'}}>No events on this date</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {selectedDateEvents.map((e, i) => (
                  <div key={i} style={{background:'rgba(255,255,255,0.05)',padding:'1rem',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
                      <span>{e.icon}</span>
                      <span style={{fontWeight:600,color:'white'}}>{e.name || e.team_name}</span>
                      <span className={`card-badge ${e.difficulty?.toLowerCase() || ''}`} style={{marginLeft:'auto'}}>{e.eventType}</span>
                    </div>
                    {e.duration && <span style={{color:'rgba(255,255,255,0.5)',fontSize:'0.85rem'}}>{e.duration} min</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default CalendarView;
