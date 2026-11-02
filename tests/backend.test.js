const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { createApp } = require('../backend/app');

const adminToken = 'test-admin-token-that-is-at-least-thirty-two-characters';
const allowedOrigin = 'https://siddharth440.github.io';
let server;
let baseUrl;
let dataDirectory;

const complaint = {
  id: 'CMP-TEST12345',
  name: 'Test Citizen',
  title: 'Blocked neighborhood drain',
  category: 'Drainage Problems',
  description: 'Water is not draining after rainfall.',
  zoneId: 'zone-1',
  zoneName: 'Zone 1',
  location: 'Example Street',
  date: '2026-11-02',
  time: '10:30',
  priority: 'High'
};

before(async () => {
  dataDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'civic-api-test-'));
  const app = createApp({
    databasePath: path.join(dataDirectory, 'complaints.json'),
    uploadDirectory: path.join(dataDirectory, 'uploads'),
    allowedOrigins: [allowedOrigin],
    adminToken
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  if (dataDirectory) await fs.rm(dataDirectory, { recursive: true, force: true });
});

test('health endpoint returns status and allows the configured GitHub Pages origin', async () => {
  const response = await fetch(`${baseUrl}/api/health`, { headers: { Origin: allowedOrigin } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
  assert.equal((await response.json()).status, 'ok');
});

test('complaints can be submitted and publicly tracked without revealing citizen name', async () => {
  const created = await fetch(`${baseUrl}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: allowedOrigin },
    body: JSON.stringify(complaint)
  });
  assert.equal(created.status, 201);
  const publicRecord = (await created.json()).complaint;
  assert.equal(publicRecord.id, complaint.id);
  assert.equal(publicRecord.status, 'Submitted');
  assert.equal('name' in publicRecord, false);

  const tracked = await fetch(`${baseUrl}/api/complaints/${complaint.id}`);
  assert.equal(tracked.status, 200);
  assert.equal((await tracked.json()).complaint.title, complaint.title);
});

test('invalid submissions and unapproved origins are rejected', async () => {
  const invalid = await fetch(`${baseUrl}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...complaint, priority: 'Urgent' })
  });
  assert.equal(invalid.status, 400);

  const blockedOrigin = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://unapproved.example' }
  });
  assert.equal(blockedOrigin.status, 403);
});

test('admin CRUD routes require a bearer token and persist authority updates', async () => {
  const unauthorized = await fetch(`${baseUrl}/api/admin/complaints`);
  assert.equal(unauthorized.status, 401);

  const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
  const listed = await fetch(`${baseUrl}/api/admin/complaints`, { headers });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).complaints.length, 1);

  const updated = await fetch(`${baseUrl}/api/admin/complaints/${complaint.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'Resolved', department: 'Water & Drainage', resolution: 'Cleared the drain.' })
  });
  assert.equal(updated.status, 200);
  const resolved = (await updated.json()).complaint;
  assert.equal(resolved.status, 'Resolved');
  assert.equal(resolved.history.at(-1).status, 'Resolved');

  const removed = await fetch(`${baseUrl}/api/admin/complaints/${complaint.id}`, {
    method: 'DELETE',
    headers
  });
  assert.equal(removed.status, 204);
  assert.equal((await fetch(`${baseUrl}/api/complaints/${complaint.id}`)).status, 404);
});

test('image upload checks allowed type, size, and file signature', async () => {
  const created = await fetch(`${baseUrl}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint)
  });
  assert.equal(created.status, 201);

  const invalidImage = await fetch(`${baseUrl}/api/complaints/${complaint.id}/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType: 'image/png', data: 'data:image/png;base64,SGVsbG8=' })
  });
  assert.equal(invalidImage.status, 400);

  const png = Buffer.alloc(45);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.writeUInt32BE(13, 8);
  png.write('IHDR', 12);
  png.writeUInt32BE(1, 16);
  png.writeUInt32BE(1, 20);
  png.write('IEND', 37);
  const validHeader = png.toString('base64');
  const validImage = await fetch(`${baseUrl}/api/complaints/${complaint.id}/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType: 'image/png', data: `data:image/png;base64,${validHeader}` })
  });
  assert.equal(validImage.status, 201);
});
