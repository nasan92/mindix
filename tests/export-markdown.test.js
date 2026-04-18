/**
 * Unit tests for MarkdownExportSerializer
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSerializer() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "ExportMarkdown.js"),
    "utf8"
  );
  // ExportMarkdown.js only uses mindmaps namespace — no jQuery or DOM needed
  const context = { mindmaps: {}, console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.mindmaps.MarkdownExportSerializer;
}

/**
 * Build a lightweight mock node for export tests.
 * @param {string} caption
 * @param {Array}  children  array of already-constructed mock nodes
 */
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

// ─── Tests ────────────────────────────────────────────────────────────────────

function testSerializeRootOnly() {
  const s = buildSerializer();
  const doc = makeDoc(makeNode("My Map"));
  const md = s.serialize(doc);
  assert.strictEqual(md, "# My Map", "Root node alone should produce a single h1");
}

function testSerializeRootWithBranches() {
  const s = buildSerializer();
  const root = makeNode("Root", [
    makeNode("Branch A"),
    makeNode("Branch B"),
  ]);
  const md = s.serialize(makeDoc(root));
  const lines = md.split("\n");
  assert.strictEqual(lines[0], "# Root");
  // Blank separator before each top-level branch
  assert(lines.includes("## Branch A"), "Branch A should be h2");
  assert(lines.includes("## Branch B"), "Branch B should be h2");
}

function testSerializeBlankLineBetweenTopLevelBranches() {
  const s = buildSerializer();
  const root = makeNode("Root", [makeNode("A"), makeNode("B")]);
  const md = s.serialize(makeDoc(root));
  const lines = md.split("\n");
  // There should be a blank line before each h2 (except when it immediately follows h1)
  const aIdx = lines.indexOf("## A");
  const bIdx = lines.indexOf("## B");
  assert(bIdx > aIdx, "B comes after A");
  assert.strictEqual(lines[bIdx - 1], "", "Blank line must precede second h2 branch");
}

function testSerializeNested3Levels() {
  const s = buildSerializer();
  const root = makeNode("Root", [
    makeNode("L2", [
      makeNode("L3"),
    ]),
  ]);
  const md = s.serialize(makeDoc(root));
  assert(md.includes("## L2"), "Depth 1 → h2");
  assert(md.includes("### L3"), "Depth 2 → h3");
}

function testSerializeDepth4AsH4() {
  const s = buildSerializer();
  const root = makeNode("Root", [
    makeNode("L2", [
      makeNode("L3", [
        makeNode("L4"),
      ]),
    ]),
  ]);
  const md = s.serialize(makeDoc(root));
  assert(md.includes("#### L4"), "Depth 3 → h4");
}

function testSerializeDepthBeyond4BecomesListItem() {
  const s = buildSerializer();
  const root = makeNode("Root", [
    makeNode("L2", [
      makeNode("L3", [
        makeNode("L4", [
          makeNode("L5"),
        ]),
      ]),
    ]),
  ]);
  const md = s.serialize(makeDoc(root));
  assert(md.includes("- L5"), "Depth 4+ should become a list item");
}

function testSerializeDepth6IsIndentedListItem() {
  const s = buildSerializer();
  // depth 5: indent = "  ".repeat(5 - 4) = "  " (one extra level of indentation)
  const root = makeNode("Root", [
    makeNode("L2", [
      makeNode("L3", [
        makeNode("L4", [
          makeNode("L5", [
            makeNode("L6"),
          ]),
        ]),
      ]),
    ]),
  ]);
  const md = s.serialize(makeDoc(root));
  assert(md.includes("  - L6"), "Depth 5 should produce a list item with 2-space indent");
  assert(!md.includes("    - L6"), "Depth 5 must not over-indent to 4 spaces");
}

function testSerializeMultilineCaptionCollapsed() {
  const s = buildSerializer();
  // Captions with embedded newlines should be collapsed to a single line
  const root = makeNode("Root", [makeNode("Line1\nLine2")]);
  const md = s.serialize(makeDoc(root));
  assert(md.includes("## Line1 Line2"), "Embedded newlines in caption should be replaced with space");
}

function testSerializeEmptyCaptionSkipped() {
  const s = buildSerializer();
  const root = makeNode("Root", [
    makeNode(""),       // empty — must be skipped
    makeNode("Valid"),
  ]);
  const md = s.serialize(makeDoc(root));
  assert(!md.includes("## \n"), "Empty captions must not produce a heading line");
  assert(md.includes("## Valid"));
}

function testSerializeWhitespaceCaptionSkipped() {
  const s = buildSerializer();
  const root = makeNode("Root", [makeNode("   \t  "), makeNode("OK")]);
  const md = s.serialize(makeDoc(root));
  assert(!md.includes("##    \t  "), "Whitespace-only captions must be skipped");
  assert(md.includes("## OK"));
}

function testSerializeMultipleBranchesWithChildren() {
  const s = buildSerializer();
  const root = makeNode("Root", [
    makeNode("Alpha", [makeNode("A1"), makeNode("A2")]),
    makeNode("Beta",  [makeNode("B1")]),
  ]);
  const md = s.serialize(makeDoc(root));
  assert(md.includes("## Alpha"));
  assert(md.includes("### A1"));
  assert(md.includes("### A2"));
  assert(md.includes("## Beta"));
  assert(md.includes("### B1"));
}

function testSerializeRootCaptionWithSpecialCharacters() {
  const s = buildSerializer();
  const root = makeNode("Title: <Ideas> & More", []);
  const md = s.serialize(makeDoc(root));
  // Special chars should be kept as-is (no HTML escaping)
  assert(md.includes("# Title: <Ideas> & More"));
}

function testSerializeOutputEndsWithoutTrailingNewline() {
  const s = buildSerializer();
  const root = makeNode("Root", [makeNode("Branch")]);
  const md = s.serialize(makeDoc(root));
  assert(!md.endsWith("\n"), "Output must not have a trailing newline");
}

function testSerializeConsistentWithImportRoundtrip() {
  // Export then check structure matches expectations of the import parser
  // (the import parser expects h1 root → h2+ branches).
  const s = buildSerializer();
  const root = makeNode("Central", [
    makeNode("Topic A", [makeNode("Sub A1")]),
    makeNode("Topic B"),
  ]);
  const md = s.serialize(makeDoc(root));
  const lines = md.split("\n").filter(Boolean);
  assert.strictEqual(lines[0], "# Central", "First line must be h1 root");
  assert(lines.some(l => l.startsWith("## Topic")), "Branches at depth 1 must be h2");
  assert(lines.some(l => l.startsWith("### Sub A1")), "Grandchildren must be h3");
}

// ─── Runner ───────────────────────────────────────────────────────────────────

(function run() {
  const tests = [
    testSerializeRootOnly,
    testSerializeRootWithBranches,
    testSerializeBlankLineBetweenTopLevelBranches,
    testSerializeNested3Levels,
    testSerializeDepth4AsH4,
    testSerializeDepthBeyond4BecomesListItem,
    testSerializeDepth6IsIndentedListItem,
    testSerializeMultilineCaptionCollapsed,
    testSerializeEmptyCaptionSkipped,
    testSerializeWhitespaceCaptionSkipped,
    testSerializeMultipleBranchesWithChildren,
    testSerializeRootCaptionWithSpecialCharacters,
    testSerializeOutputEndsWithoutTrailingNewline,
    testSerializeConsistentWithImportRoundtrip,
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

  console.log(`\nExportMarkdown: ${passed}/${tests.length} tests passed`);
})();
