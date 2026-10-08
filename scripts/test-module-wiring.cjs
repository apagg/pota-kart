const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const boot=read('app.js');
const order=['geometry-atlas.js','map-setup.js','map-layers.js','gps-controller.js','app-core.js'];
let last=-1;
for(const name of order){
  const index=boot.indexOf("load('"+name);
  assert(index>last,'Missing or incorrect module order: '+name);
  last=index;
}
const gps=read('gps-controller.js');
const core=read('app-core.js');
const layers=read('map-layers.js');
for(const name of ['locateUser','stopGps','syncGpsControl','gpsInsideSelected']){
  assert.match(gps,new RegExp('function '+name+'\\('));
  assert.doesNotMatch(core,new RegExp('function '+name+'\\('));
}
assert.match(layers,/const selectedParks=new Map\(\)/);
assert.match(layers,/const overlapLayer=/);
assert.match(gps,/map\.on\('dragstart'/);
assert.match(gps,/pota:selection/);
console.log('Map module wiring tests passed');
