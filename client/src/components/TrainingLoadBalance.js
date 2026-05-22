import React, { useEffect, useState } from 'react';
import api from '../services/api';

function TrainingLoadBalance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/training-load-balance')
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data) return <div className="page-container"><h1>Training Load Balance</h1><p>Loading training load...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Training Load Balance</h1>
        <p>Compare acute and chronic load to identify overload, productive training, and underloaded athletes.</p>
      </div>
      <div className="stats-grid">
        {Object.entries(data.summary).map(([key, value]) => (
          <div className="stat-card" key={key}>
            <h3>{value}</h3>
            <p>{key.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        ))}
      </div>
      <div className="content-grid">
        <section className="card">
          <h2>Load Bands</h2>
          {data.loadBands.map((band) => (
            <div className="list-item" key={band.band}>
              <strong>{band.band}</strong>
              <span>{band.ratio}</span>
              <p>{band.guidance}</p>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>Athlete Queue</h2>
          {data.athletes.map((athlete) => (
            <div className="list-item" key={athlete.name}>
              <strong>{athlete.name} - {athlete.sport}</strong>
              <span>ACWR {athlete.acuteChronicRatio} - {athlete.risk}</span>
              <p>{athlete.action}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default TrainingLoadBalance;
