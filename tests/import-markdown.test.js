/**
 * Unit tests for MarkdownImportParser (parseHeadings + autoLayout)
 * and the full parse() pipeline.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a vm context that loads Point.js and ImportMarkdown.js together
 * with the minimal mindmaps stubs needed to call parseHeadings and
 * autoLayout.computePositions.
 *
 * The full parse() method also requires Document/Node/MindMap stubs.
 */
function buildContext() {
  const pointSrc = fs.readFileSync(
    path.join(__dirname, "..", "js", "Point.js"),
    "utf8"
  );
  const importSrc = fs.readFileSync(
    path.join(__dirname, "..", "js", "ImportMarkdown.js"),
    "utf8"
  );

  // Minimal jQuery-like $.extend used by Node/MindMap setPluginData
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

  // Minimal Node implementation
  function makeMockNode(id) {
    const node = {
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
    return node;
  }

  // Minimal NodeMap
  function makeMockNodeMap() {
    return {
      _nodes: {},
      add(node) { this._nodes[node.id] = node; },
      remove(node) { delete this._nodes[node.id]; },
      each(fn) { Object.values(this._nodes).forEach(fn); },
    };
  }

  // Minimal MindMap
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

  // Minimal Document
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
      Node: null,   // set below after context is ready
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

  // Expose mock node constructor so parse() can use new mindmaps.Node
  context.mindmaps.Node = function() { return makeMockNode(); };
  context.mindmaps.Node.prototype = {};
  // Override the mindmaps.Node constructor with one that returns a proper mock
  // (using a factory attached to context that the vm code calls as `new mindmaps.Node`)
  context.mindmaps.Node = makeMockNode;

  return context;
}

// Extract just parseHeadings without running full parse
function parseHeadings(md) {
  return buildContext().mindmaps.MarkdownImportParser.parseHeadings(md);
}

// ─── parseHeadings tests ──────────────────────────────────────────────────────

function testParseHeadingsBasicHierarchy() {
  const result = parseHeadings("# Root\n## Branch A\n### Leaf 1\n## Branch B");
  assert.strictEqual(result.rootCaption, "Root");
  assert.strictEqual(result.headings.length, 3);
  assert.strictEqual(result.headings[0].caption, "Branch A");
  assert.strictEqual(result.headings[0].level, 2);
  assert.strictEqual(result.headings[1].caption, "Leaf 1");
  assert.strictEqual(result.headings[1].level, 3);
  assert.strictEqual(result.headings[2].caption, "Branch B");
  assert.strictEqual(result.headings[2].level, 2);
}

function testParseHeadingsMultipleH1TreatedAsRootChildren() {
  // Additional h1 headings after the first are treated as level-2 branches
  const result = parseHeadings("# Main\n# Section Two\n## Sub");
  assert.strictEqual(result.rootCaption, "Main");
  // "Section Two" (level 1 → becomes level 2) and "Sub" (level 2) should appear
  const captions = result.headings.map(h => h.caption);
  assert(captions.includes("Section Two"), "Secondary h1 should be included as branch");
  assert(captions.includes("Sub"));
}

function testParseHeadingsReturnsRawLevels() {
  // parseHeadings() returns raw heading levels as written in the markdown.
  // Level clamping (max 4) only happens later in parse().
  const result = parseHeadings("# Root\n## L2\n### L3\n#### L4\n##### L5\n###### L6");
  // Spread into outer-context array to avoid vm cross-realm deepStrictEqual issues
  const levels = Array.from(result.headings).map(h => h.level);
  assert.deepStrictEqual(levels, [2, 3, 4, 5, 6], "parseHeadings must return raw markdown levels unchanged");
}

function testParseHeadingsTrimsTrailingHashes() {
  // ATX headings can have trailing hashes: ## Heading ##
  const result = parseHeadings("# Root\n## Branch ## ");
  assert.strictEqual(result.headings[0].caption, "Branch", "Trailing hashes must be stripped");
}

function testParseHeadingsIgnoresCodeBlocks() {
  const md = [
    "# Root",
    "## Branch",
    "```",
    "# Inside code block — not a heading",
    "```",
    "## After code block",
  ].join("\n");
  const result = parseHeadings(md);
  const captions = result.headings.map(h => h.caption);
  assert(!captions.includes("Inside code block — not a heading"), "Code blocks must be skipped");
  assert(captions.includes("After code block"));
}

function testParseHeadingsWindowsLineEndings() {
  const result = parseHeadings("# Root\r\n## Branch A\r\n### Leaf");
  assert.strictEqual(result.rootCaption, "Root");
  assert.strictEqual(result.headings.length, 2);
}

function testParseHeadingsThrowsWithNoHeadings() {
  assert.throws(
    () => parseHeadings("just plain text with no headings"),
    /heading/i,
    "Should throw when no markdown headings are found"
  );
}

function testParseHeadingsThrowsWithNoH1() {
  assert.throws(
    () => parseHeadings("## Branch\n### Leaf"),
    /top-level heading/i,
    "Should throw when there is no h1 heading"
  );
}

function testParseHeadingsEmptyStringThrows() {
  assert.throws(() => parseHeadings(""), /heading/i);
}

function testParseHeadingsListItemsUnderHeading() {
  const md = [
    "# Root",
    "## Topics",
    "- Item A",
    "- Item B",
    "  - Nested",
  ].join("\n");
  const result = parseHeadings(md);
  const captions = result.headings.map(h => h.caption);
  assert(captions.includes("Item A"), "List items under heading should be parsed");
  assert(captions.includes("Item B"));
  assert(captions.includes("Nested"), "Nested list items should be parsed");
}

function testParseHeadingsListItemsIgnoredBeforeFirstHeading() {
  const md = "- orphan item\n# Root\n## Branch";
  const result = parseHeadings(md);
  const captions = result.headings.map(h => h.caption);
  assert(!captions.includes("orphan item"), "List items before first heading must be ignored");
}

function testParseHeadingsNumberedLists() {
  const md = "# Root\n## Items\n1. First\n2. Second";
  const result = parseHeadings(md);
  const captions = result.headings.map(h => h.caption);
  assert(captions.includes("First"), "Numbered list items should be parsed");
  assert(captions.includes("Second"));
}

function testParseHeadingsDeepNestingLevelsAreRelativeToParentHeading() {
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
}

// ─── autoLayout tests ─────────────────────────────────────────────────────────

function makeLayoutNode(id, childNodes) {
  const node = {
    id: id || "n-" + Math.random().toString(36).slice(2),
    children: childNodes || [],
    getChildren(recursive) {
      if (!recursive) return this.children;
      const all = [];
      this.children.forEach(c => { all.push(...c.getChildren(true)); all.push(c); });
      return all;
    },
  };
  return node;
}

function testAutoLayoutSingleChildGoesRight() {
  const ctx = buildContext();
  const { autoLayout } = ctx.mindmaps;
  const child = makeLayoutNode("child");
  const root = makeLayoutNode("root", [child]);
  const positions = autoLayout.computePositions(root);
  assert.strictEqual(positions.length, 1);
  assert(positions[0].point.x > 0, "Single child should be placed on the right side");
}

function testAutoLayoutTwoChildrenBalancedLeftRight() {
  const ctx = buildContext();
  const { autoLayout } = ctx.mindmaps;
  const a = makeLayoutNode("a");
  const b = makeLayoutNode("b");
  const root = makeLayoutNode("root", [a, b]);
  const positions = autoLayout.computePositions(root);
  assert.strictEqual(positions.length, 2);
  const xValues = positions.map(p => p.point.x);
  const hasRight = xValues.some(x => x > 0);
  const hasLeft = xValues.some(x => x < 0);
  assert(hasRight && hasLeft, "Two children should be split left and right");
}

function testAutoLayoutNoChildrenReturnsEmpty() {
  const ctx = buildContext();
  const { autoLayout } = ctx.mindmaps;
  const root = makeLayoutNode("root", []);
  const positions = autoLayout.computePositions(root);
  // Use length check to avoid cross-realm Array prototype mismatch in deepStrictEqual
  assert.strictEqual(Array.isArray(positions), true, "computePositions must return an array");
  assert.strictEqual(positions.length, 0, "Root with no children returns empty positions");
}

function testAutoLayoutSubtreeHeightLeafIsNodeHeight() {
  const ctx = buildContext();
  const { autoLayout } = ctx.mindmaps;
  const leaf = makeLayoutNode("leaf");
  assert.strictEqual(autoLayout.getSubtreeHeight(leaf), autoLayout.NODE_HEIGHT);
}

function testAutoLayoutSubtreeHeightWithChildren() {
  const ctx = buildContext();
  const { autoLayout } = ctx.mindmaps;
  const c1 = makeLayoutNode("c1");
  const c2 = makeLayoutNode("c2");
  const parent = makeLayoutNode("parent", [c1, c2]);
  const expected = 2 * autoLayout.NODE_HEIGHT + autoLayout.CHILD_GAP * 1;
  assert.strictEqual(autoLayout.getSubtreeHeight(parent), expected);
}

function testAutoLayoutPositionsIncludeGrandchildren() {
  const ctx = buildContext();
  const { autoLayout } = ctx.mindmaps;
  const grandchild = makeLayoutNode("gc");
  const child = makeLayoutNode("child", [grandchild]);
  const root = makeLayoutNode("root", [child]);
  const positions = autoLayout.computePositions(root);
  // Both child and grandchild should get positions
  assert.strictEqual(positions.length, 2, "Both child and grandchild must be positioned");
  const ids = positions.map(p => p.node.id);
  assert(ids.includes("child"));
  assert(ids.includes("gc"));
}

function testAutoLayoutSymmetricChildrenAreCentered() {
  const ctx = buildContext();
  const { autoLayout } = ctx.mindmaps;
  const c1 = makeLayoutNode("c1");
  const c2 = makeLayoutNode("c2");
  const c3 = makeLayoutNode("c3");
  const c4 = makeLayoutNode("c4");
  const root = makeLayoutNode("root", [c1, c2, c3, c4]);
  const positions = autoLayout.computePositions(root);
  // Positions should be symmetric: sum of all y values close to 0
  const totalY = positions.reduce((sum, p) => sum + p.point.y, 0);
  assert(Math.abs(totalY) < 1, `Y positions should be roughly symmetric around zero, got sum=${totalY}`);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

(function run() {
  const tests = [
    // parseHeadings
    testParseHeadingsBasicHierarchy,
    testParseHeadingsMultipleH1TreatedAsRootChildren,
    testParseHeadingsReturnsRawLevels,
    testParseHeadingsTrimsTrailingHashes,
    testParseHeadingsIgnoresCodeBlocks,
    testParseHeadingsWindowsLineEndings,
    testParseHeadingsThrowsWithNoHeadings,
    testParseHeadingsThrowsWithNoH1,
    testParseHeadingsEmptyStringThrows,
    testParseHeadingsListItemsUnderHeading,
    testParseHeadingsListItemsIgnoredBeforeFirstHeading,
    testParseHeadingsNumberedLists,
    testParseHeadingsDeepNestingLevelsAreRelativeToParentHeading,
    // autoLayout
    testAutoLayoutSingleChildGoesRight,
    testAutoLayoutTwoChildrenBalancedLeftRight,
    testAutoLayoutNoChildrenReturnsEmpty,
    testAutoLayoutSubtreeHeightLeafIsNodeHeight,
    testAutoLayoutSubtreeHeightWithChildren,
    testAutoLayoutPositionsIncludeGrandchildren,
    testAutoLayoutSymmetricChildrenAreCentered,
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

  console.log(`\nImportMarkdown: ${passed}/${tests.length} tests passed`);
})();
