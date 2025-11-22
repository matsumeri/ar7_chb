import {useEffect, useState} from 'react';

export default function Admin() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{fontFamily: 'Arial, sans-serif', padding: 20}}>
      <h1>Panel Admin — Leads capturados</h1>
      {loading ? <p>Cargando...</p> : (
        <div>
          <p>Total leads: {leads.length}</p>
          <ul>
            {leads.map((l, i) => (
              <li key={i}><pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(l, null, 2)}</pre></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
