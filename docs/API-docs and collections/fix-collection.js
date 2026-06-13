const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, 'M01_Capture_Transcription_Frontend_API_Collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Fix Update Note request body to match UpdateNoteSchema
function findItem(name, items) {
  for (const item of items) {
    if (item.name === name) return item;
    if (item.item) {
      const found = findItem(name, item.item);
      if (found) return found;
    }
  }
}

const updateNote = findItem('Update Note', collection.item);
if (updateNote && updateNote.request && updateNote.request.body) {
  let bodyStr = updateNote.request.body.raw;
  // Replace "note" with "content" in the JSON string
  bodyStr = bodyStr.replace(/"note"\s*:/, '"content":');
  updateNote.request.body.raw = bodyStr;
}

function makeEvent(execLines) {
  return {
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: execLines,
    },
  };
}

function setTest(item, execLines) {
  if (!item.event) item.event = [];
  const idx = item.event.findIndex((e) => e.listen === 'test');
  const ev = makeEvent(execLines);
  if (idx >= 0) {
    item.event[idx] = ev;
  } else {
    item.event.push(ev);
  }
}

// Universal data unwrapper script
const unwrapper = [
  'var r = pm.response.json();',
  'var d = r.data || r;',
  'if (d.data) d = d.data;', // Handle double wrapping
  'var dbg = " Response: " + JSON.stringify(r);'
];

const getActivityContextTest = [
  'pm.test("Status is 200", function () { pm.response.to.have.status(200); });',
  'pm.test("Has activities array", function () {',
  ...unwrapper,
  // The endpoint returns { activities: [...] } not activityContext
  '  pm.expect(d.activities || d.activityContext, "Expected d.activities to be an array." + dbg).to.be.an("array");',
  '});',
];

function traverse(items) {
  for (const item of items) {
    if (item.item) {
      traverse(item.item);
    } else {
      const name = item.name;
      if (name === 'Get Activity Context') {
        setTest(item, getActivityContextTest);
      }
    }
  }
}

traverse(collection.item);

const output = JSON.stringify(collection, null, 2);
fs.writeFileSync(collectionPath, output);
console.log('SUCCESS: Fixed Update Note payload and Get Activity Context assertions!');
