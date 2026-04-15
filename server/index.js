const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  db: { schema: process.env.SUPABASE_SCHEMA || 'public' },
  auth: { persistSession: false },
});

// ── Home page ──────────────────────────────────────────────
app.get('/', async (req, res) => {
  const { data: prospects, error } = await supabase
    .from('prospects')
    .select('id, name, address, status, created_at')
    .order('created_at', { ascending: false });

  const rows = error
    ? `<p style="color:#f87171">DB error: ${error.message}</p>`
    : (prospects || []).map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.address || '—'}</td>
          <td><span class="pill pill-${p.status}">${p.status}</span></td>
        </tr>`).join('');

  res.send(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Prospectauria</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #0a0a0f; color: #e5e7eb; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 32px; margin: 0 0 6px; }
    .tag { color: #22d3ee; font-size: 14px; font-weight: 500; }
    .status { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 13px; color: #9ca3af; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; }
    .card { background: #111118; border: 1px solid #1f1f2e; border-radius: 12px; padding: 20px; margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #1f1f2e; font-size: 14px; }
    th { color: #6b7280; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
    .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .pill-new { background: #1e3a8a33; color: #60a5fa; }
    .pill-contacted { background: #92400e33; color: #fbbf24; }
    .pill-won { background: #14532d33; color: #4ade80; }
    .empty { text-align: center; color: #6b7280; padding: 40px 0; font-size: 14px; }
    .meta { margin-top: 20px; font-size: 12px; color: #6b7280; }
    code { font-family: ui-monospace, monospace; color: #22d3ee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="tag">PROSPECTAURIA · v0.1</div>
    <h1>Mini-CRM prospects 🎯</h1>
    <div class="status"><span class="dot"></span>Server running · Schema: <code>${process.env.SUPABASE_SCHEMA || 'public'}</code></div>

    <div class="card">
      <table>
        <thead>
          <tr><th>Nom</th><th>Adresse</th><th>Statut</th></tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="3" class="empty">Aucun prospect pour le moment.</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="meta">
      API JSON → <code>GET /api/prospects</code> · <code>POST /api/prospects</code> · <code>PATCH /api/prospects/:id</code>
    </div>
  </div>
</body>
</html>`);
});

// ── API ─────────────────────────────────────────────────────
app.get('/api/prospects', async (req, res) => {
  const { data, error } = await supabase.from('prospects').select('*');
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.post('/api/prospects', async (req, res) => {
  const { data, error } = await supabase.from('prospects').insert([req.body]).select();
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.patch('/api/prospects/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('prospects')
    .update(req.body)
    .eq('id', req.params.id)
    .select();
  if (error) return res.status(500).json(error);
  res.json(data);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
