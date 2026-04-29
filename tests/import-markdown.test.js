const { test, describe } = require("node:test");
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContext() {
  const pointSrc = fs.readFileSync(path.join(__dirname, "..", "js", "Point.js"), "utf8");
  const importSrc = fs.readFileSync(path.join(__dirname, "..", "js", "ImportMarkdown.js"), "utf8");

  function shallowExtend(target) {
    for (let i = 1; i < arguments.length; i++) {
      const src = arguments[i] || {};
      Object.keys(src).forEach((k) => { target[k] = src[k]; });
    }
    return target;
  }
  function deepExtend(target, src) {
    if (!src) return target;
    Object.keys(src).forEach((k) => {
      const v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        target[k] = deepExtend(target[k] || {}, v);
      } else {
        target[k] = v;
      }
    });
    return target;
  }

  function makeMockNode(id) {
    return {
      id: id || "n" + Math.random().toString(36).slice(2),
      parent: null,
      children: [],
      text: { caption: "New Idea" },
      pluginData: {
        style: {
          font: { style: "normal", weight: "normal", decoration: "none", align: "center", fontfamily: "sans-serif", size: 15, color: "#000000" },
          border: { visible: false, style: "none", color: "#ffffff", background: "#ffffff" },
          lineWidthOffset: 0,
          branchColor: "#000000",
        },
        layout: { offset: { x: 0, y: 0 }, foldChildren: false },
      },
      isRoot() { return this.parent === null; },
      addChild(child) { child.parent = this; this.children.push(child); },
      removeChild(child) { child.parent = null; this.children = this.children.filter(c => c !== child); },
      forEachChild(fn) { this.children.forEach(fn); },
      forEachDescendant(fn) { this.children.forEach(c => { fn(c); c.forEachDescendant(fn); }); },
      getChildren(recursive) {
        if (!recursive) return this.children.slice();
        const all = [];
        this.children.forEach(c => { all.push(...c.getChildren(true)); all.push(c); });
        return all;
      },
      getParent() { return this.parent; },
      getRoot() { let n = this; while (n.parent) n = n.parent; return n; },
      getDepth() { let d = 0, n = this.parent; while (n) { d++; n = n.parent; } return d; },
      getCaption() { return this.text.caption; },
      setCaption(c) { this.text.caption = c; },
      getPluginData(group, key) {
        this.pluginData = this.pluginData || {};
        this.pluginData[group] = this.pluginData[group] || {};
        return this.pluginData[group][key];
      },
      setPluginData(group, key, val) {
        this.pluginData = this.pluginData || {};
        this.pluginData[group] = this.pluginData[group] || {};
        this.pluginData[group][key] = val;
      },
    };
  }

  function makeMockNodeMap() {
    return {
      _nodes: {},
      add(node) { this._nodes[node.id] = node; },
      remove(node) { delete this._nodes[node.id]; },
      each(fn) { Object.values(this._nodes).forEach(fn); },
    };
  }

  function makeMockMindMap(root) {
    const mm = {
      root,
      nodes: makeMockNodeMap(),
      getRoot() { return this.root; },
      addNode(node) { this.nodes.add(node); node.forEachDescendant(d => this.nodes.add(d)); },
    };
    mm.nodes.add(root);
    return mm;
  }

  function MockDocument() {
    const root = makeMockNode("root");
    root.text.caption = "Central Idea";
    this.id = "doc-" + Math.random().toString(36).slice(2);
    this.title = "New Document";
    this.mindmap = makeMockMindMap(root);
    this.cnodes = [];
    this.getConnectedNodes = () => this.cnodes;
  }

  let branchColorIndex = 0;
  const branchColors = ["#333399", "#008080", "#33cccc", "#000080", "#008000"];

  const context = {
    console,
    mindmaps: {
      Util: {
        createUUID: () => "uuid-" + Math.random().toString(36).slice(2),
        getId: () => "id-" + Math.random().toString(36).slice(2),
        getNextRootBranchColor: (parentNode) => {
          const idx = parentNode ? parentNode.children.length : branchColorIndex++;
          return branchColors[idx % branchColors.length];
        },
        getOrderedChildren: (node) => node.children,
      },
      migrations: [],
      Node: null,
      Document: MockDocument,
    },
    $: {
      extend(...args) {
        if (typeof args[0] === "boolean") {
          return args.slice(1).reduce((t, s) => deepExtend(t, s), args[1] || {});
        }
        return args.reduce((t, s) => shallowExtend(t, s || {}));
      },
    },
  };

  vm.createContext(context);
  vm.runInContext(pointSrc, context);
  vm.runInContext(importSrc, context);
  context.mindmaps.Node = makeMockNode;

  return context;
}

// Build context once — the parser and autoLayout are stateless between calls
const ctx = buildContext();
const { MarkdownImportParser, autoLayout } = ctx.mindmaps;

function parseHeadings(md) {
  return MarkdownImportParser.parseHeadings(md);
}

// ─── parseHeadings ────────────────────────────────────────────────────────────

describe("parseHeadings", () => {
  test("basic hierarchy", () => {
    const result = parseHeadings("# Root\n## Branch A\n### Leaf 1\n## Branch B");
    assert.strictEqual(result.rootCaption, "Root");
    assert.strictEqual(result.headings.length, 3);
    assert.strictEqual(result.headings[0].caption, "Branch A");
    assert.strictEqual(result.headings[0].level, 2);
    assert.strictEqual(result.headings[1].caption, "Leaf 1");
    assert.strictEqual(result.headings[1].level, 3);
    assert.strictEqual(result.headings[2].caption, "Branch B");
    assert.strictEqual(result.headings[2].level, 2);
  });

  test("additional h1 headings are treated as root children", () => {
    const result = parseHeadings("# Main\n# Section Two\n## Sub");
    assert.strictEqual(result.rootCaption, "Main");
    const captions = result.headings.map(h => h.caption);
    assert(captions.includes("Section Two"), "Secondary h1 should be included as branch");
    assert(captions.includes("Sub"));
  });

  test("returns raw heading levels unchanged", () => {
    const result = parseHeadings("# Root\n## L2\n### L3\n#### L4\n##### L5\n###### L6");
    const levels = Array.from(result.headings).map(h => h.level);
    assert.deepStrictEqual(levels, [2, 3, 4, 5, 6], "parseHeadings must return raw markdown levels unchanged");
  });

  test("trims trailing hashes from ATX headings", () => {
    const result = parseHeadings("# Root\n## Branch ## ");
    assert.strictEqual(result.headings[0].caption, "Branch", "Trailing hashes must be stripped");
  });

  test("ignores headings inside code blocks", () => {
    const md = ["# Root", "## Branch", "```", "# Inside code block — not a heading", "```", "## After code block"].join("\n");
    const result = parseHeadings(md);
    const captions = result.headings.map(h => h.caption);
    assert(!captions.includes("Inside code block — not a heading"), "Code blocks must be skipped");
    assert(captions.includes("After code block"));
  });

  test("handles Windows line endings", () => {
    const result = parseHeadings("# Root\r\n## Branch A\r\n### Leaf");
    assert.strictEqual(result.rootCaption, "Root");
    assert.strictEqual(result.headings.length, 2);
  });

  test("throws when no headings are found", () => {
    assert.throws(() => parseHeadings("just plain text with no headings"), /heading/i);
  });

  test("throws when there is no h1 heading", () => {
    assert.throws(() => parseHeadings("## Branch\n### Leaf"), /top-level heading/i);
  });

  test("throws on empty string", () => {
    assert.throws(() => parseHeadings(""), /heading/i);
  });

  test("parses list items under a heading", () => {
    const md = ["# Root", "## Topics", "- Item A", "- Item B", "  - Nested"].join("\n");
    const result = parseHeadings(md);
    const captions = result.headings.map(h => h.caption);
    assert(captions.includes("Item A"), "List items under heading should be parsed");
    assert(captions.includes("Item B"));
    assert(captions.includes("Nested"), "Nested list items should be parsed");
  });

  test("ignores list items before the first heading", () => {
    const result = parseHeadings("- orphan item\n# Root\n## Branch");
    const captions = result.headings.map(h => h.caption);
    assert(!captions.includes("orphan item"), "List items before first heading must be ignored");
  });

  test("parses numbered list items", () => {
    const result = parseHeadings("# Root\n## Items\n1. First\n2. Second");
    const captions = result.headings.map(h => h.caption);
    assert(captions.includes("First"), "Numbered list items should be parsed");
    assert(captions.includes("Second"));
  });

  test("deeply nested list items have increasing level numbers", () => {
    const md = "# Root\n## Level2\n- L3 list\n  - L4 nested\n    - L5 deep";
    const result = parseHeadings(md);
    const l3 = result.headings.find(h => h.caption === "L3 list");
    const l4 = result.headings.find(h => h.caption === "L4 nested");
    const l5 = result.headings.find(h => h.caption === "L5 deep");
    assert(l3, "Level 3 list item should exist");
    assert(l4, "Level 4 nested list item should exist");
    assert(l5, "Level 5 deep nested list item should exist");
    assert(l3.level < l4.level, "Deeper list nesting = higher level number");
    assert(l4.level < l5.level);
  });
});

// ─── autoLayout ───────────────────────────────────────────────────────────────

function makeLayoutNode(id, childNodes) {
  return {
    id: id || "n-" + Math.random().toString(36).slice(2),
    children: childNodes || [],
    getChildren(recursive) {
      if (!recursive) return this.children;
      const all = [];
      this.children.forEach(c => { all.push(...c.getChildren(true)); all.push(c); });
      return all;
    },
  };
}

describe("autoLayout", () => {
  test("single child is placed on the right side", () => {
    const root = makeLayoutNode("root", [makeLayoutNode("child")]);
    const positions = autoLayout.computePositions(root);
    assert.strictEqual(positions.length, 1);
    assert(positions[0].point.x > 0, "Single child should be placed on the right side");
  });

  test("two children are split left and right", () => {
    const root = makeLayoutNode("root", [makeLayoutNode("a"), makeLayoutNode("b")]);
    const positions = autoLayout.computePositions(root);
    assert.strictEqual(positions.length, 2);
    const xValues = positions.map(p => p.point.x);
    assert(xValues.some(x => x > 0) && xValues.some(x => x < 0), "Two children should be split left and right");
  });

  test("root with no children returns empty positions", () => {
    const positions = autoLayout.computePositions(makeLayoutNode("root", []));
    assert.strictEqual(Array.isArray(positions), true);
    assert.strictEqual(positions.length, 0);
  });

  test("subtree height of a leaf equals NODE_HEIGHT", () => {
    assert.strictEqual(autoLayout.getSubtreeHeight(makeLayoutNode("leaf")), autoLayout.NODE_HEIGHT);
  });

  test("subtree height with children includes gaps", () => {
    const parent = makeLayoutNode("parent", [makeLayoutNode("c1"), makeLayoutNode("c2")]);
    const expected = 2 * autoLayout.NODE_HEIGHT + autoLayout.CHILD_GAP * 1;
    assert.strictEqual(autoLayout.getSubtreeHeight(parent), expected);
  });

  test("positions include grandchildren", () => {
    const grandchild = makeLayoutNode("gc");
    const child = makeLayoutNode("child", [grandchild]);
    const root = makeLayoutNode("root", [child]);
    const positions = autoLayout.computePositions(root);
    assert.strictEqual(positions.length, 2, "Both child and grandchild must be positioned");
    const ids = positions.map(p => p.node.id);
    assert(ids.includes("child"));
    assert(ids.includes("gc"));
  });

  test("symmetric children are centered around y=0", () => {
    const root = makeLayoutNode("root", [
      makeLayoutNode("c1"), makeLayoutNode("c2"),
      makeLayoutNode("c3"), makeLayoutNode("c4"),
    ]);
    const positions = autoLayout.computePositions(root);
    const totalY = positions.reduce((sum, p) => sum + p.point.y, 0);
    assert(Math.abs(totalY) < 1, `Y positions should be roughly symmetric around zero, got sum=${totalY}`);
  });
});

// ─── parse (tree structure) ───────────────────────────────────────────────────

describe("parse", () => {
  test("nested list items become children, not siblings", () => {
    const ctx2 = buildContext();
    const doc = ctx2.mindmaps.MarkdownImportParser.parse(
      "# Root\n## Topics\n- Item A\n  - Sub Item\n- Item B"
    );
    const root = doc.mindmap.getRoot();
    const topics = root.children.find(n => n.getCaption() === "Topics");
    assert(topics, "Topics node should exist");
    const itemA = topics.children.find(n => n.getCaption() === "Item A");
    assert(itemA, "Item A should be a child of Topics");
    const subItem = itemA.children.find(n => n.getCaption() === "Sub Item");
    assert(subItem, "Sub Item should be a child of Item A");
    assert.strictEqual(
      topics.children.find(n => n.getCaption() === "Sub Item"),
      undefined,
      "Sub Item must NOT appear as a sibling of Item A"
    );
  });

  test("nested list items under h3 heading become children", () => {
    const ctx2 = buildContext();
    const doc = ctx2.mindmaps.MarkdownImportParser.parse(
      "# Root\n### Deep\n- Item\n  - Sub Item"
    );
    const root = doc.mindmap.getRoot();
    const deep = root.children.find(n => n.getCaption() === "Deep");
    assert(deep, "Deep node should exist as root child");
    const item = deep.children.find(n => n.getCaption() === "Item");
    assert(item, "Item should be a child of Deep");
    const subItem = item.children.find(n => n.getCaption() === "Sub Item");
    assert(subItem, "Sub Item should be a child of Item, not a sibling");
  });

  test("three levels of list nesting produce correct hierarchy", () => {
    const ctx2 = buildContext();
    const doc = ctx2.mindmaps.MarkdownImportParser.parse(
      "# Root\n## H2\n- A\n  - B\n    - C"
    );
    const root = doc.mindmap.getRoot();
    const h2 = root.children.find(n => n.getCaption() === "H2");
    const a = h2.children.find(n => n.getCaption() === "A");
    const b = a.children.find(n => n.getCaption() === "B");
    const c = b.children.find(n => n.getCaption() === "C");
    assert(a, "A should be child of H2");
    assert(b, "B should be child of A");
    assert(c, "C should be child of B");
  });
});
