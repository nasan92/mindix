const { test } = require("node:test");
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

// NodeMap class has no shared state — build once for all tests
const NodeMap = buildNodeMap();

// ─── Tests ────────────────────────────────────────────────────────────────────

test("is empty on creation", () => {
  const map = new NodeMap();
  assert.strictEqual(map.size(), 0, "New NodeMap must be empty");
  assert.strictEqual(map.values().length, 0, "values() on empty map returns an empty array");
});

test("add increases size and returns true for new node", () => {
  const map = new NodeMap();
  const n = makeNode("a");
  const added = map.add(n);
  assert.strictEqual(added, true, "add() should return true for new node");
  assert.strictEqual(map.size(), 1);
});

test("add duplicate returns false and does not increase size", () => {
  const map = new NodeMap();
  const n = makeNode("x");
  map.add(n);
  const added = map.add(n);
  assert.strictEqual(added, false, "add() must return false when node with same id already exists");
  assert.strictEqual(map.size(), 1, "Duplicate add must not increase size");
});

test("get returns node by id", () => {
  const map = new NodeMap();
  const n = makeNode("id-42");
  map.add(n);
  assert.strictEqual(map.get("id-42"), n, "get() must return the node with the given id");
  assert.strictEqual(map.get("missing"), undefined, "get() returns undefined for unknown id");
});

test("remove decreases size and returns true", () => {
  const map = new NodeMap();
  const n = makeNode("rm");
  map.add(n);
  const removed = map.remove(n);
  assert.strictEqual(removed, true, "remove() should return true for existing node");
  assert.strictEqual(map.size(), 0, "size must decrease after remove");
  assert.strictEqual(map.get("rm"), undefined, "get() returns undefined after removal");
});

test("remove non-existent node returns false", () => {
  const map = new NodeMap();
  const n = makeNode("ghost");
  const removed = map.remove(n);
  assert.strictEqual(removed, false, "remove() returns false when node is not in map");
});

test("size tracks add and remove correctly", () => {
  const map = new NodeMap();
  const nodes = [makeNode("1"), makeNode("2"), makeNode("3")];
  nodes.forEach(n => map.add(n));
  assert.strictEqual(map.size(), 3);
  map.remove(nodes[1]);
  assert.strictEqual(map.size(), 2);
  map.remove(nodes[0]);
  assert.strictEqual(map.size(), 1);
});

test("values contains all added nodes", () => {
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
});

test("values excludes removed nodes", () => {
  const map = new NodeMap();
  const a = makeNode("a");
  const b = makeNode("b");
  map.add(a);
  map.add(b);
  map.remove(a);
  const vals = map.values();
  assert(!vals.includes(a), "Removed node must not appear in values()");
  assert(vals.includes(b));
});

test("each iterates all nodes", () => {
  const map = new NodeMap();
  const ids = ["x", "y", "z"];
  ids.forEach(id => map.add(makeNode(id)));
  const seen = [];
  map.each(n => seen.push(n.id));
  assert.deepStrictEqual(seen.sort(), ids.sort(), "each() must visit exactly all nodes");
});

test("each skips removed nodes", () => {
  const map = new NodeMap();
  const a = makeNode("a");
  const b = makeNode("b");
  map.add(a);
  map.add(b);
  map.remove(a);
  const seen = [];
  map.each(n => seen.push(n.id));
  assert.deepStrictEqual(seen, ["b"], "each() must skip removed nodes");
});

test("re-adding same id after removal succeeds", () => {
  const map = new NodeMap();
  const n1 = makeNode("dup");
  const n2 = makeNode("dup");
  map.add(n1);
  map.remove(n1);
  const added = map.add(n2);
  assert.strictEqual(added, true, "Should be able to re-add a node after removing it");
  assert.strictEqual(map.size(), 1);
  assert.strictEqual(map.get("dup"), n2);
});

test("handles 100 nodes correctly", () => {
  const map = new NodeMap();
  const count = 100;
  for (let i = 0; i < count; i++) {
    map.add(makeNode("bulk-" + i));
  }
  assert.strictEqual(map.size(), count);
  assert.strictEqual(map.values().length, count);
});
