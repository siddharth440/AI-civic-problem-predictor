const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const express = require('express');
const path = require('node:path');
const { JsonComplaintStore } = require('./storage');

const CATEGORIES = new Set([
  'Road Damage', 'Water Leakage', 'Garbage Overflow', 'Drainage Problems',
  'Street Light Failure', 'Traffic Congestion', 'Flood Risk', 'Public Safety',
  'Other Civic Issues'
]);
const PRIORITIES = new Set(['Low', 'Medium', 'High', 'Critical']);
const STATUSES = new Set(['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected']);

function createApp(options = {}) {
  const app = express();
  const store = options.store || new JsonComplaintStore(
    options.databasePath || process.env.DATA_FILE || './backend/data/complaints.json'
  );
  const uploadDirectory = options.uploadDirectory || path.resolve(path.dirname(
    options.databasePath || process.env.DATA_FILE || './backend/data/complaints.json'
  ), 'uploads');
  const allowedOrigins = options.allowedOrigins || String(process.env.FRONTEND_ORIGINS || '')
    .split(',').map(origin => origin.trim()).filter(Boolean);
  const adminToken = options.adminToken ?? process.env.ADMIN_API_TOKEN ?? '';
  const submissionsByIp = new Map();
  const adminFailuresByIp = new Map();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Cache-Control', 'no-store');
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Origin is not allowed.' });
    if (origin) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: '7mb', strict: true }));

  const requireAdmin = (req, res, next) => {
    if (Buffer.byteLength(adminToken) < 32) {
      return res.status(503).json({ error: 'Admin API is disabled until ADMIN_API_TOKEN contains at least 32 characters.' });
    }
    const supplied = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const expectedBuffer = Buffer.from(adminToken);
    const suppliedBuffer = Buffer.from(supplied);
    if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      const attempts = (adminFailuresByIp.get(req.ip) || []).filter(timestamp => timestamp > Date.now() - 15 * 60 * 1000);
      attempts.push(Date.now());
      adminFailuresByIp.set(req.ip, attempts);
      if (attempts.length > 10) return res.status(429).json({ error: 'Too many failed admin authentication attempts.' });
      return res.status(401).json({ error: 'Valid admin bearer token required.' });
    }
    adminFailuresByIp.delete(req.ip);
    next();
  };

  const publicComplaint = complaint => ({
    id: complaint.id,
    title: complaint.title,
    category: complaint.category,
    description: complaint.description,
    zoneId: complaint.zoneId,
    zoneName: complaint.zoneName,
    location: complaint.location,
    date: complaint.date,
    time: complaint.time,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    priority: complaint.priority,
    status: complaint.status,
    department: complaint.department || '',
    resolution: complaint.resolution || '',
    hasImage: Boolean(complaint.imageFile),
    history: complaint.history || []
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'civic-complaints-api' }));

  app.post('/api/complaints', async (req, res, next) => {
    try {
      const now = Date.now();
      const ip = req.ip;
      const windowStart = now - 60 * 60 * 1000;
      const submissions = (submissionsByIp.get(ip) || []).filter(timestamp => timestamp > windowStart);
      if (submissions.length >= 20) return res.status(429).json({ error: 'Submission limit reached. Try again later.' });
      const complaint = validateComplaint(req.body);
      await store.update(records => {
        if (records.some(record => record.id === complaint.id)) {
          complaint.id = createUniqueComplaintId(records.map(record => record.id));
        }
        records.unshift(complaint);
      });
      submissions.push(now);
      submissionsByIp.set(ip, submissions);
      res.status(201).json({ complaint: publicComplaint(complaint) });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  });

  app.get('/api/complaints/:id', async (req, res, next) => {
    try {
      const record = (await store.list()).find(complaint => complaint.id === req.params.id);
      if (!record) return res.status(404).json({ error: 'Complaint not found.' });
      res.json({ complaint: publicComplaint(record) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/complaints/:id/image', async (req, res, next) => {
    let savedPath;
    let fileWritten = false;
    try {
      const currentUploads = (submissionsByIp.get(req.ip) || []).filter(timestamp => timestamp > Date.now() - 60 * 60 * 1000);
      if (currentUploads.length >= 30) return res.status(429).json({ error: 'Upload limit reached. Try again later.' });
      const { mimeType, data } = req.body || {};
      const match = typeof data === 'string' && data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/);
      if (!match || match[1] !== mimeType) return res.status(400).json({ error: 'Upload must be a JPEG, PNG, or WebP data URL.' });
      const image = Buffer.from(match[2], 'base64');
      if (!image.length || image.length > 5 * 1024 * 1024) return res.status(413).json({ error: 'Image must be no larger than 5 MB.' });
      if (!hasValidImageSignature(image, mimeType)) return res.status(400).json({ error: 'Image content does not match its declared file type.' });
      submissionsByIp.set(req.ip, [...currentUploads, Date.now()]);
      const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[mimeType];
      const fileName = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
      await fs.mkdir(uploadDirectory, { recursive: true });
      savedPath = path.join(uploadDirectory, fileName);
      await fs.writeFile(savedPath, image, { flag: 'wx', mode: 0o600 });
      fileWritten = true;
      const attached = await store.update(records => {
        const complaint = records.find(record => record.id === req.params.id);
        if (!complaint) return false;
        complaint.imageFile = fileName;
        complaint.updatedAt = new Date().toISOString();
        return true;
      });
      if (!attached) {
        const error = new Error('Complaint not found.');
        error.status = 404;
        throw error;
      }
      res.status(201).json({ uploaded: true });
    } catch (error) {
      if (savedPath && fileWritten) await fs.unlink(savedPath).catch(unlinkError => {
        console.error('Unable to remove incomplete image upload.', unlinkError);
      });
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  });

  app.get('/api/admin/complaints', requireAdmin, async (req, res, next) => {
    try {
      res.json({ complaints: await store.list() });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/admin/complaints/:id', requireAdmin, async (req, res, next) => {
    try {
      const { status, department, resolution } = req.body || {};
      if (status !== undefined && !STATUSES.has(status)) return res.status(400).json({ error: 'Invalid complaint status.' });
      if (department !== undefined && (typeof department !== 'string' || department.length > 120)) {
        return res.status(400).json({ error: 'Department must be a string up to 120 characters.' });
      }
      if (resolution !== undefined && (typeof resolution !== 'string' || resolution.length > 2000)) {
        return res.status(400).json({ error: 'Resolution must be a string up to 2000 characters.' });
      }
      const updated = await store.update(records => {
        const complaint = records.find(record => record.id === req.params.id);
        if (!complaint) return null;
        const at = new Date().toISOString();
        if (status !== undefined && status !== complaint.status) {
          complaint.status = status;
          if (status === 'Resolved') complaint.resolvedAt = at;
          complaint.history = complaint.history || [];
          complaint.history.push({ status, at, note: `Status changed to ${status}.` });
        }
        if (department !== undefined && department !== complaint.department) {
          complaint.department = department;
          complaint.history = complaint.history || [];
          complaint.history.push({ status: complaint.status, at, note: `Assigned to ${department || 'unassigned'}.` });
        }
        if (resolution !== undefined) complaint.resolution = resolution;
        complaint.updatedAt = at;
        return complaint;
      });
      if (!updated) return res.status(404).json({ error: 'Complaint not found.' });
      res.json({ complaint: updated });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/admin/complaints/:id', requireAdmin, async (req, res, next) => {
    try {
      const removed = await store.update(records => {
        const index = records.findIndex(record => record.id === req.params.id);
        return index === -1 ? false : records.splice(index, 1).length === 1;
      });
      if (!removed) return res.status(404).json({ error: 'Complaint not found.' });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Request body must be valid JSON.' });
    console.error('Civic API request failed.', error);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

function validateComplaint(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const fields = ['name', 'title', 'category', 'description', 'zoneId', 'zoneName', 'location', 'date', 'time'];
  for (const field of fields) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      const error = new Error(`${field} is required.`);
      error.status = 400;
      throw error;
    }
  }
  if (input.name.length > 120 || input.title.length > 120 || input.description.length > 4000
      || input.location.length > 240 || input.zoneName.length > 120) {
    const error = new Error('One or more text fields exceed the allowed length.');
    error.status = 400;
    throw error;
  }
  if (!CATEGORIES.has(input.category) || !PRIORITIES.has(input.priority)) {
    const error = new Error('Complaint category or priority is invalid.');
    error.status = 400;
    throw error;
  }
  const incidentDate = new Date(`${input.date}T${input.time}:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)
      || Number.isNaN(incidentDate.getTime()) || incidentDate.toISOString().slice(0, 10) !== input.date
      || Number(input.time.slice(0, 2)) > 23 || Number(input.time.slice(3, 5)) > 59) {
    const error = new Error('Incident date or time is invalid.');
    error.status = 400;
    throw error;
  }
  const id = typeof input.id === 'string' && /^REP-[A-Z0-9]{6}$/.test(input.id)
    ? input.id
    : createUniqueComplaintId();
  const createdAt = new Date().toISOString();
  return {
    id,
    name: input.name.trim(),
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    zoneId: input.zoneId.trim(),
    zoneName: input.zoneName.trim(),
    location: input.location.trim(),
    date: input.date,
    time: input.time,
    createdAt,
    updatedAt: createdAt,
    priority: input.priority,
    status: 'Submitted',
    department: '',
    resolution: '',
    history: [{ status: 'Submitted', at: createdAt, note: 'Complaint received.' }]
  };
}

function createUniqueComplaintId(existingIds = []) {
  const usedIds = new Set(existingIds.map(id => String(id).toUpperCase()));
  for (let attempt = 0; attempt < 100; attempt++) {
    const id = `REP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    if (!usedIds.has(id)) return id;
  }
  throw new Error('Unable to generate a unique complaint ID.');
}

function hasValidImageSignature(image, mimeType) {
  if (mimeType === 'image/jpeg') {
    return image.length >= 4 && image[0] === 0xff && image[1] === 0xd8
      && image[image.length - 2] === 0xff && image[image.length - 1] === 0xd9;
  }
  if (mimeType === 'image/png') {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (image.length < 45 || !image.subarray(0, 8).equals(signature)
        || image.readUInt32BE(8) !== 13 || image.toString('ascii', 12, 16) !== 'IHDR'
        || image.readUInt32BE(16) === 0 || image.readUInt32BE(20) === 0) return false;
    let offset = 8;
    while (offset + 12 <= image.length) {
      const length = image.readUInt32BE(offset);
      if (length > image.length - offset - 12) return false;
      const chunkType = image.toString('ascii', offset + 4, offset + 8);
      offset += 12 + length;
      if (chunkType === 'IEND') return length === 0 && offset === image.length;
    }
    return false;
  }
  if (mimeType === 'image/webp') {
    return image.length >= 20 && image.toString('ascii', 0, 4) === 'RIFF'
      && image.readUInt32LE(4) === image.length - 8
      && image.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

module.exports = { createApp, hasValidImageSignature, validateComplaint };
