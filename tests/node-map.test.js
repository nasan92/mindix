/**
 * Unit tests for NodeMap
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNodeMap() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "NodeMap.js"),
    "utf8"
  );
  const context = { mindmaps: {}, console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.mindmaps.NodeMap;
}

let idCounter = 1;
function makeNode(id) {
  return { id: id !== undefined ? id : "node-" + idCounter++ };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

function testNodeMapIsEmptyOnCreation() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  assert.strictEqual(map.size(), 0, "New NodeMap must be empty");
  // Use length check to avoid cross-realm Array prototype issues with deepStrictEqual
  assert.strictEqual(map.values().length, 0, "values() on empty map returns an empty array");
}

function testNodeMapAddAndSize() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const n = makeNode("a");
  const added = map.add(n);
  assert.strictEqual(added, true, "add() should return true for new node");
  assert.strictEqual(map.size(), 1);
}

function testNodeMapAddDuplicateReturnsFalse() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const n = makeNode("x");
  map.add(n);
  const added = map.add(n);
  assert.strictEqual(added, false, "add() must return false when node with same id already exists");
  assert.strictEqual(map.size(), 1, "Duplicate add must not increase size");
}

function testNodeMapGetById() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const n = makeNode("id-42");
  map.add(n);
  assert.strictEqual(map.get("id-42"), n, "get() must return the node with the given id");
  assert.strictEqual(map.get("missing"), undefined, "get() returns undefined for unknown id");
}

function testNodeMapRemove() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const n = makeNode("rm");
  map.add(n);
  const removed = map.remove(n);
  assert.strictEqual(removed, true, "remove() should return true for existing node");
  assert.strictEqual(map.size(), 0, "size must decrease after remove");
  assert.strictEqual(map.get("rm"), undefined, "get() returns undefined after removal");
}

function testNodeMapRemoveNonExistentReturnsFalse() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const n = makeNode("ghost");
  const removed = map.remove(n);
  assert.strictEqual(removed, false, "remove() returns false when node is not in map");
}

function testNodeMapSizeTracksCorrectly() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const nodes = [makeNode("1"), makeNode("2"), makeNode("3")];
  nodes.forEach(n => map.add(n));
  assert.strictEqual(map.size(), 3);
  map.remove(nodes[1]);
  assert.strictEqual(map.size(), 2);
  map.remove(nodes[0]);
  assert.strictEqual(map.size(), 1);
}

function testNodeMapValuesContainsAllNodes() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const a = makeNode("a");
  const b = makeNode("b");
  const c = makeNode("c");
  map.add(a);
  map.add(b);
  map.add(c);
  const vals = map.values();
  assert.strictEqual(vals.length, 3);
  assert(vals.includes(a));
  assert(vals.includes(b));
  assert(vals.includes(c));
}

function testNodeMapValuesExcludesRemovedNodes() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const a = makeNode("a");
  const b = makeNode("b");
  map.add(a);
  map.add(b);
  map.remove(a);
  const vals = map.values();
  assert(!vals.includes(a), "Removed node must not appear in values()");
  assert(vals.includes(b));
}

function testNodeMapEachIteratesAllNodes() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const ids = ["x", "y", "z"];
  ids.forEach(id => map.add(makeNode(id)));
  const seen = [];
  map.each(n => seen.push(n.id));
  assert.deepStrictEqual(seen.sort(), ids.sort(), "each() must visit exactly all nodes");
}

function testNodeMapEachSkipsRemovedNodes() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const a = makeNode("a");
  const b = makeNode("b");
  map.add(a);
  map.add(b);
  map.remove(a);
  const seen = [];
  map.each(n => seen.push(n.id));
  assert.deepStrictEqual(seen, ["b"], "each() must skip removed nodes");
}

function testNodeMapAddAfterRemoveSameId() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const n1 = makeNode("dup");
  const n2 = makeNode("dup"); // same id, different object
  map.add(n1);
  map.remove(n1);
  const added = map.add(n2);
  assert.strictEqual(added, true, "Should be able to re-add a node after removing it");
  assert.strictEqual(map.size(), 1);
  assert.strictEqual(map.get("dup"), n2);
}

function testNodeMapManyNodes() {
  const NodeMap = buildNodeMap();
  const map = new NodeMap();
  const count = 100;
  for (let i = 0; i < count; i++) {
    map.add(makeNode("bulk-" + i));
  }
  assert.strictEqual(map.size(), count);
  assert.strictEqual(map.values().length, count);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

(function run() {
  const tests = [
    testNodeMapIsEmptyOnCreation,
    testNodeMapAddAndSize,
    testNodeMapAddDuplicateReturnsFalse,
    testNodeMapGetById,
    testNodeMapRemove,
    testNodeMapRemoveNonExistentReturnsFalse,
    testNodeMapSizeTracksCorrectly,
    testNodeMapValuesContainsAllNodes,
    testNodeMapValuesExcludesRemovedNodes,
    testNodeMapEachIteratesAllNodes,
    testNodeMapEachSkipsRemovedNodes,
    testNodeMapAddAfterRemoveSameId,
    testNodeMapManyNodes,
  ];

  let passed = 0;
  tests.forEach((fn) => {
    try {
      fn();
      passed++;
      console.log("PASS", fn.name);
    } catch (err) {
      console.error("FAIL", fn.name, "-", err.message);
      process.exitCode = 1;
    }
  });

  console.log(`\nNodeMap: ${passed}/${tests.length} tests passed`);
})();
