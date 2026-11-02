const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadRiskMap() {
  const context = vm.createContext({
    document: { addEventListener() {} },
    window: {},
    Number,
    Math,
    Map,
    Set,
    String,
    Array
  });
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'map.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'js/map.js' });
  return vm.runInContext('RiskMap', context);
}

test('Haversine distance returns accurate meter distances', () => {
  const map = loadRiskMap();
  const distance = map.haversineDistance(0, 0, 0, 1);
  assert.ok(Math.abs(distance - 111195) < 100);
});

test('nearby complaint filters apply radius and sort nearest first', () => {
  const map = loadRiskMap();
  const reports = [
    { id: 'far', latitude: 0.03, longitude: 0, category: 'Road Damage', priority: 'High', status: 'Submitted' },
    { id: 'near', latitude: 0.001, longitude: 0, category: 'Road Damage', priority: 'High', status: 'Submitted' },
    { id: 'middle', latitude: 0.008, longitude: 0, category: 'Drainage Problems', priority: 'Medium', status: 'Resolved' },
    { id: 'unmapped', category: 'Road Damage', priority: 'High', status: 'Submitted' }
  ];
  const center = { latitude: 0, longitude: 0 };

  const withinOneKm = map.getNearbyComplaints(reports, center, 1000, '', '', '');
  assert.deepEqual(Array.from(withinOneKm, report => report.id), ['near', 'middle']);
  const filtered = map.getNearbyComplaints(reports, center, 5000, 'Road Damage', 'High', 'Submitted');
  assert.deepEqual(Array.from(filtered, report => report.id), ['near', 'far']);
  assert.equal(map.getNearbyComplaints(reports, center, 500, '', '', '').length, 1);
});

test('missing coordinates are excluded without treating null as zero degrees', () => {
  const map = loadRiskMap();
  assert.equal(map.isValidCoordinate(null, null), false);
  assert.equal(map.isValidCoordinate('', ''), false);
  assert.equal(map.isValidCoordinate(0, 0), true);
  const mapped = map.getNearbyComplaints([
    { id: 'missing', latitude: null, longitude: null },
    { id: 'zero', latitude: 0, longitude: 0 }
  ], { latitude: 0, longitude: 0 }, 500, '', '', '');
  assert.deepEqual(Array.from(mapped, report => report.id), ['zero']);
});
