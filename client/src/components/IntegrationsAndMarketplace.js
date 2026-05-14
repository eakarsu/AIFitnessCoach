// Apply Pass 5 — surface previously-orphaned integrations + marketplace endpoints in FE.
import React, { useEffect, useState } from 'react';
import api from '../services/api';

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Pre({ data }) {
  if (data === null || data === undefined) return null;
  return <pre style={{ background: '#0f172a', color: '#a7f3d0', padding: 12, borderRadius: 6, overflow: 'auto', fontSize: 12 }}>{typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</pre>;
}

export default function IntegrationsAndMarketplace() {
  const [status, setStatus] = useState(null);
  const [statusErr, setStatusErr] = useState(null);
  const [provider, setProvider] = useState('fitbit');
  const [syncRes, setSyncRes] = useState(null);
  const [syncErr, setSyncErr] = useState(null);
  const [log, setLog] = useState(null);

  const [amount, setAmount] = useState(2500);
  const [purpose, setPurpose] = useState('coach_session');
  const [payRes, setPayRes] = useState(null);
  const [payErr, setPayErr] = useState(null);

  const [listings, setListings] = useState(null);
  const [listingsErr, setListingsErr] = useState(null);
  const [challenges, setChallenges] = useState(null);
  const [challengesErr, setChallengesErr] = useState(null);
  const [chTitle, setChTitle] = useState('30-day push-up challenge');
  const [chMetric, setChMetric] = useState('reps');

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/integrations/_/status');
        setStatus(r.data);
      } catch (e) {
        setStatusErr(e.response?.data?.error || e.message);
      }
    })();
  }, []);

  const sync = async () => {
    setSyncErr(null);
    setSyncRes(null);
    try {
      const r = await api.post('/integrations/wearable/sync', { provider });
      setSyncRes(r.data);
    } catch (e) {
      setSyncErr(e.response?.data?.error || e.message);
      if (e.response?.data) setSyncRes(e.response.data);
    }
  };

  const fetchLog = async () => {
    try {
      const r = await api.get('/integrations/wearable/log');
      setLog(r.data);
    } catch (e) {
      setLog({ error: e.response?.data?.error || e.message });
    }
  };

  const checkout = async () => {
    setPayErr(null);
    setPayRes(null);
    try {
      const r = await api.post('/integrations/payments/checkout', { amount_cents: Number(amount), purpose });
      setPayRes(r.data);
    } catch (e) {
      setPayErr(e.response?.data?.error || e.message);
      if (e.response?.data) setPayRes(e.response.data);
    }
  };

  const loadListings = async () => {
    setListingsErr(null);
    try {
      const r = await api.get('/marketplace/listings');
      setListings(r.data);
    } catch (e) {
      setListingsErr(e.response?.data?.error || e.message);
    }
  };
  const loadChallenges = async () => {
    setChallengesErr(null);
    try {
      const r = await api.get('/marketplace/challenges');
      setChallenges(r.data);
    } catch (e) {
      setChallengesErr(e.response?.data?.error || e.message);
    }
  };
  const createChallenge = async () => {
    setChallengesErr(null);
    try {
      const r = await api.post('/marketplace/challenges', { title: chTitle, metric: chMetric });
      setChallenges(r.data);
    } catch (e) {
      setChallengesErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <h2>Integrations & Marketplace (Pass 5)</h2>

      <Section title="Capability status">
        {statusErr && <div style={{ color: '#b91c1c' }}>{statusErr}</div>}
        <Pre data={status} />
      </Section>

      <Section title="Wearable sync">
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="fitbit">fitbit</option>
          <option value="garmin">garmin</option>
          <option value="whoop">whoop</option>
          <option value="apple_health">apple_health</option>
        </select>{' '}
        <button onClick={sync}>Trigger sync</button>{' '}
        <button onClick={fetchLog}>Show log</button>
        {syncErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{syncErr}</div>}
        <Pre data={syncRes} />
        <Pre data={log} />
      </Section>

      <Section title="Coach payments (Stripe stub)">
        <label>amount cents <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>{' '}
        <label>purpose <input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></label>{' '}
        <button onClick={checkout}>Checkout</button>
        {payErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{payErr}</div>}
        <Pre data={payRes} />
      </Section>

      <Section title="Marketplace listings">
        <button onClick={loadListings}>Load listings</button>
        {listingsErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{listingsErr}</div>}
        <Pre data={listings} />
      </Section>

      <Section title="Group challenges">
        <button onClick={loadChallenges}>Load challenges</button>{' '}
        <input value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="title" style={{ width: 280 }} />{' '}
        <input value={chMetric} onChange={(e) => setChMetric(e.target.value)} placeholder="metric" style={{ width: 120 }} />{' '}
        <button onClick={createChallenge}>Create</button>
        {challengesErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{challengesErr}</div>}
        <Pre data={challenges} />
      </Section>
    </div>
  );
}
