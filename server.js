import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());

// For quick schema dev updates, if the db exists we just use it, but SQLite ALTER allows little.
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS volunteers (id TEXT, name TEXT, email TEXT, phone TEXT, city TEXT, cause TEXT, experience TEXT, idType TEXT, idFileName TEXT, availability TEXT, registeredAt TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS events (id TEXT, name TEXT, description TEXT, location TEXT, cause TEXT, organizerName TEXT, eventDate TEXT, registrationDeadline TEXT, createdAt TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS registrations (id TEXT, eventId TEXT, volunteerId TEXT, registrationDate TEXT, status TEXT, certificateGenerated INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS feedback (id TEXT, eventId TEXT, volunteerId TEXT, rating INTEGER, comment TEXT, submittedAt TEXT)");
});

app.post('/api/volunteers', (req, res) => {
  const v = req.body;
  const stmt = db.prepare("INSERT INTO volunteers VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  stmt.run(v.id, v.name, v.email, v.phone, v.city, v.cause, v.experience, v.idType, v.idFileName, JSON.stringify(v.availability), v.registeredAt);
  stmt.finalize();
  res.send({success: true});
});

app.post('/api/events', (req, res) => {
  const e = req.body;
  const stmt = db.prepare("INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?)");
  stmt.run(e.id, e.name, e.description, e.location, e.cause, e.organizerName || 'Volunteer Connect', e.eventDate, e.registrationDeadline, e.createdAt);
  stmt.finalize();
  res.send({success: true});
});

app.post('/api/registrations', (req, res) => {
  const r = req.body;
  const stmt = db.prepare("INSERT INTO registrations VALUES (?,?,?,?,?,?)");
  stmt.run(r.id, r.eventId, r.volunteerId, r.registrationDate, r.status, r.certificateGenerated ? 1 : 0);
  stmt.finalize();
  res.send({success: true});
});

app.post('/api/feedback', (req, res) => {
  const f = req.body;
  const stmt = db.prepare("INSERT INTO feedback VALUES (?,?,?,?,?,?)");
  stmt.run(f.id, f.eventId, f.volunteerId, f.rating, f.comment, f.submittedAt);
  stmt.finalize();
  res.send({success: true});
});

app.get('/api/db', (req, res) => {
  const result = {};
  db.serialize(() => {
    db.all("SELECT * FROM volunteers", (err, vols) => {
      result.volunteers = vols || [];
      db.all("SELECT * FROM events", (err, evts) => {
        result.events = evts || [];
        db.all("SELECT * FROM registrations", (err, regs) => {
          result.registrations = regs || [];
          db.all("SELECT * FROM feedback", (err, fbs) => {
             result.feedback = fbs || [];
             res.json(result);
          });
        });
      });
    });
  });
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on port ${PORT}`);
});
