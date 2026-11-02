const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { webcrypto } = require('node:crypto');

function createDataStore() {
  const values = new Map();
  const context = vm.createContext({
    window: {},
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value))
    },
    indexedDB: undefined,
    crypto: webcrypto,
    Uint8Array,
    Date,
    JSON,
    Math,
    Set,
    console
  });
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'js/data.js' });
  return {
    store: vm.runInContext('DataStore', context),
    values
  };
}

test('DataStore creates unique REP IDs while preserving its existing ID API', () => {
  const { store, values } = createDataStore();
  const firstId = store.createComplaintId();
  assert.match(firstId, /^REP-[A-Z0-9]{6}$/);

  const reports = store.getReports();
  values.set('sih_civic_reports', JSON.stringify([...reports, { id: firstId }]));
  const secondId = store.createComplaintId();
  assert.match(secondId, /^REP-[A-Z0-9]{6}$/);
  assert.notEqual(secondId, firstId);

  assert.equal(typeof store.createId, 'function');
  assert.equal(typeof store.addReport, 'function');
  assert.equal(typeof store.updateReportStatus, 'function');
});
