const { test } = require("node:test");
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function buildSerializer() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "ExportMarkdown.js"),
    "utf8"
  );
  const context = { mindmaps: {}, console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.mindmaps.MarkdownExportSerializer;
}

function makeNode(caption, children) {
  return {
    text: { caption },
    getCaption() { return this.text.caption; },
    getChildren() { return children || []; },
  };
}

function makeDoc(root) {
  return {
    mindmap: { getRoot() { return root; } },
  };
}

// Serializer is stateless between calls — build once for all tests
const Serializer = buildSerializer();

// ─── Tests ────────────────────────────────────────────────────────────────────

test("serialize root only produces a single h1", () => {
  const md = Serializer.serialize(makeDoc(makeNode("My Map")));
  assert.strictEqual(md, "# My Map");
});

test("serialize root with branches produces h2 entries", () => {
  const root = makeNode("Root", [makeNode("Branch A"), makeNode("Branch B")]);
  const md = Serializer.serialize(makeDoc(root));
  const lines = md.split("\n");
  assert.strictEqual(lines[0], "# Root");
  assert(lines.includes("## Branch A"), "Branch A should be h2");
  assert(lines.includes("## Branch B"), "Branch B should be h2");
});

test("blank line separates top-level branches", () => {
  const root = makeNode("Root", [makeNode("A"), makeNode("B")]);
  const md = Serializer.serialize(makeDoc(root));
  const lines = md.split("\n");
  const bIdx = lines.indexOf("## B");
  assert(bIdx > lines.indexOf("## A"), "B comes after A");
  assert.strictEqual(lines[bIdx - 1], "", "Blank line must precede second h2 branch");
});

test("nested 3 levels uses correct heading depths", () => {
  const root = makeNode("Root", [makeNode("L2", [makeNode("L3")])]);
  const md = Serializer.serialize(makeDoc(root));
  assert(md.includes("## L2"), "Depth 1 → h2");
  assert(md.includes("### L3"), "Depth 2 → h3");
});

test("depth 4 produces h4", () => {
  const root = makeNode("Root", [makeNode("L2", [makeNode("L3", [makeNode("L4")])])]);
  const md = Serializer.serialize(makeDoc(root));
  assert(md.includes("#### L4"), "Depth 3 → h4");
});

test("depth beyond 4 becomes a list item", () => {
  const root = makeNode("Root", [makeNode("L2", [makeNode("L3", [makeNode("L4", [makeNode("L5")])])])]);
  const md = Serializer.serialize(makeDoc(root));
  assert(md.includes("- L5"), "Depth 4+ should become a list item");
});

test("depth 6 produces an indented list item", () => {
  const root = makeNode("Root", [makeNode("L2", [makeNode("L3", [makeNode("L4", [makeNode("L5", [makeNode("L6")])])])])]);
  const md = Serializer.serialize(makeDoc(root));
  assert(md.includes("  - L6"), "Depth 5 should produce a list item with 2-space indent");
  assert(!md.includes("    - L6"), "Depth 5 must not over-indent to 4 spaces");
});

test("multiline caption is collapsed to a single line", () => {
  const root = makeNode("Root", [makeNode("Line1\nLine2")]);
  const md = Serializer.serialize(makeDoc(root));
  assert(md.includes("## Line1 Line2"), "Embedded newlines in caption should be replaced with space");
});

test("empty caption is skipped", () => {
  const root = makeNode("Root", [makeNode(""), makeNode("Valid")]);
  const md = Serializer.serialize(makeDoc(root));
  assert(!md.includes("## \n"), "Empty captions must not produce a heading line");
  assert(md.includes("## Valid"));
});

test("whitespace-only caption is skipped", () => {
  const root = makeNode("Root", [makeNode("   \t  "), makeNode("OK")]);
  const md = Serializer.serialize(makeDoc(root));
  assert(!md.includes("##    \t  "), "Whitespace-only captions must be skipped");
  assert(md.includes("## OK"));
});

test("multiple branches with children", () => {
  const root = makeNode("Root", [
    makeNode("Alpha", [makeNode("A1"), makeNode("A2")]),
    makeNode("Beta", [makeNode("B1")]),
  ]);
  const md = Serializer.serialize(makeDoc(root));
  assert(md.includes("## Alpha"));
  assert(md.includes("### A1"));
  assert(md.includes("### A2"));
  assert(md.includes("## Beta"));
  assert(md.includes("### B1"));
});

test("special characters in root caption are preserved", () => {
  const root = makeNode("Title: <Ideas> & More", []);
  const md = Serializer.serialize(makeDoc(root));
  assert(md.includes("# Title: <Ideas> & More"));
});

test("output does not end with a trailing newline", () => {
  const root = makeNode("Root", [makeNode("Branch")]);
  const md = Serializer.serialize(makeDoc(root));
  assert(!md.endsWith("\n"), "Output must not have a trailing newline");
});

test("serialized output is consistent with import parser expectations", () => {
  const root = makeNode("Central", [
    makeNode("Topic A", [makeNode("Sub A1")]),
    makeNode("Topic B"),
  ]);
  const md = Serializer.serialize(makeDoc(root));
  const lines = md.split("\n").filter(Boolean);
  assert.strictEqual(lines[0], "# Central", "First line must be h1 root");
  assert(lines.some(l => l.startsWith("## Topic")), "Branches at depth 1 must be h2");
  assert(lines.some(l => l.startsWith("### Sub A1")), "Grandchildren must be h3");
});
