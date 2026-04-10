const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function deepMerge(target) {
  for (let i = 1; i < arguments.length; i++) {
    const src = arguments[i] || {};
    Object.keys(src).forEach((key) => {
      const value = src[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        target[key] = deepMerge(target[key] || {}, value);
      } else {
        target[key] = value;
      }
    });
  }
  return target;
}

function makeNode(id, caption, pluginData) {
  const node = {
    id,
    parent: null,
    children: [],
    text: { caption: caption || "" },
    pluginData: pluginData || {},
    addChild(child) {
      child.parent = this;
      this.children.push(child);
    },
    forEachChild(fn) {
      this.children.forEach(fn);
    },
    forEachDescendant(fn) {
      this.children.forEach((child) => {
        fn(child);
        child.forEachDescendant(fn);
      });
    },
    isRoot() {
      return this.parent === null;
    },
    getParent() {
      return this.parent;
    },
    getRoot() {
      let current = this;
      while (current.parent) {
        current = current.parent;
      }
      return current;
    },
    getDepth() {
      let depth = 0;
      let current = this.parent;
      while (current) {
        depth += 1;
        current = current.parent;
      }
      return depth;
    },
    getCaption() {
      return this.text.caption;
    },
    getPluginData(group, key) {
      this.pluginData[group] = this.pluginData[group] || {};
      return this.pluginData[group][key];
    },
    cloneForExport() {
      const cloned = makeNode(this.id, this.text.caption, JSON.parse(JSON.stringify(this.pluginData || {})));
      this.children.forEach((child) => {
        cloned.addChild(child.cloneForExport());
      });
      return cloned;
    }
  };

  if (!node.pluginData.style) {
    node.pluginData.style = {};
  }
  if (!node.pluginData.style.font) {
    node.pluginData.style.font = {
      style: "normal",
      weight: "normal",
      decoration: "none",
      fontfamily: "sans-serif",
      size: 15,
      color: "#000000"
    };
  }
  if (!node.pluginData.style.border) {
    node.pluginData.style.border = {
      visible: true,
      style: "solid",
      color: "#333333",
      background: "#ffffff"
    };
  }
  if (!node.pluginData.style.branchColor) {
    node.pluginData.style.branchColor = "#333333";
  }
  if (!node.pluginData.layout) {
    node.pluginData.layout = {};
  }
  if (!node.pluginData.layout.offset) {
    node.pluginData.layout.offset = { x: 0, y: 0 };
  }

  return node;
}

function buildRenderer() {
  const scriptPath = path.join(__dirname, "..", "js", "ExportMap.js");
  const source = fs.readFileSync(scriptPath, "utf8");

  const context = {
    mindmaps: {
      CanvasDrawingUtil: {
        getLineWidth(node) {
          const depth = node.getDepth();
          return Math.max(1, 5 - depth);
        }
      },
      TextMetrics: {
        getTextMetrics(node) {
          const text = String(node.getCaption() || "");
          const lines = text.split(/\r\n|\r|\n/g);
          const width = Math.max(40, lines.reduce((m, line) => Math.max(m, line.length), 0) * 8);
          const height = Math.max(24, lines.length * 18);
          return {
            width,
            height,
            fontW: width,
            fontH: 18
          };
        }
      }
    },
    $: {
      extend() {
        let deep = false;
        let target;
        let start = 0;
        if (typeof arguments[0] === "boolean") {
          deep = arguments[0];
          target = arguments[1] || {};
          start = 2;
        } else {
          target = arguments[0] || {};
          start = 1;
        }
        for (let i = start; i < arguments.length; i++) {
          const src = arguments[i] || {};
          if (deep) {
            deepMerge(target, src);
          } else {
            Object.keys(src).forEach((key) => {
              target[key] = src[key];
            });
          }
        }
        return target;
      }
    },
    console,
    window: {},
    document: {}
  };

  vm.createContext(context);
  vm.runInContext(source, context, { filename: "ExportMap.js" });
  return new context.mindmaps.StaticSVGRenderer();
}

function testBasicVectorOutput() {
  const root = makeNode("root", "Root", {
    layout: { offset: { x: 0, y: 0 } }
  });
  const childA = makeNode("a", "Alpha", {
    layout: { offset: { x: 180, y: 80 } }
  });
  const childB = makeNode("b", "Beta", {
    layout: { offset: { x: -180, y: 120 } }
  });
  root.addChild(childA);
  root.addChild(childB);

  const doc = {
    mindmap: {
      getRoot() {
        return root;
      }
    },
    getConnectedNodes() {
      return [{ from: "a", to: "b", style: "dashed", arrow: "1", color: "#cc0000" }];
    }
  };

  const svg = buildRenderer().render(doc);
  assert(svg.includes("<svg "), "Expected SVG root element");
  assert(svg.includes("<path "), "Expected vector branch paths");
  assert(svg.includes("<rect "), "Expected node rectangles");
  assert(svg.includes("<text "), "Expected node text");
  // Bottom connector rects must carry branch fill color, confirming they were drawn
  assert(svg.includes('fill="#333333"') || svg.includes('fill="#008800"'), "Expected bottom connector rect with branch color");
  assert(!svg.includes('dominant-baseline="text-before-edge"'), "Should not rely on dominant-baseline for alignment");
  assert(!svg.includes('<image href="data:image/png'), "Should not contain PNG fallback image wrapper");
}

function testMalformedDataDoesNotThrow() {
  const root = makeNode("root", "Root", {
    layout: { offset: { x: 0, y: 0 } },
    style: {
      font: {
        size: 15,
        color: "#111111"
      },
      border: {
        visible: true,
        background: "#ffffff"
      },
      branchColor: "#444444"
    }
  });

  const child = makeNode("c", "Child", {
    style: {
      branchColor: "#008800"
    }
  });
  delete child.pluginData.layout;
  root.addChild(child);

  const doc = {
    mindmap: {
      getRoot() {
        return root;
      }
    },
    getConnectedNodes() {
      return [{ from: "missing", to: "c", style: "dotted", arrow: "2" }];
    }
  };

  const svg = buildRenderer().render(doc);
  assert(svg.includes("<svg "), "Expected SVG generation with malformed plugin data");
}

function testNodeUrlsAreClickableInSvg() {
  const urlNodeColor = "#ff5500";
  const root = makeNode("root", "Root", {
    layout: { offset: { x: 0, y: 0 } }
  });
  const childWithUrl = makeNode("a", "Click Me", {
    layout: { offset: { x: 180, y: 80 } },
    url: { urls: ["https://example.com"] },
    style: {
      font: {
        color: urlNodeColor
      }
    }
  });
  const childNoUrl = makeNode("b", "No URL", {
    layout: { offset: { x: -180, y: 120 } }
  });
  root.addChild(childWithUrl);
  root.addChild(childNoUrl);

  const doc = {
    mindmap: {
      getRoot() {
        return root;
      }
    },
    getConnectedNodes() {
      return [];
    }
  };

  const svg = buildRenderer().render(doc);
  // Verify xlink namespace
  assert(svg.includes('xmlns:xlink="http://www.w3.org/1999/xlink"'), "Expected xlink namespace declaration in SVG");
  // Verify link anchor with correct URL
  assert(svg.includes('xlink:href="https://example.com"'), "Expected anchor tag with xlink:href for node with URL");
  assert(svg.includes('target="_blank"'), "Expected target=_blank attribute on link");
  // Verify icon elements for the link (chain-link style) and font-color binding
  assert(svg.includes('<rect') && svg.includes('stroke="' + urlNodeColor + '"'), "Expected rect element for chain-link icon with font color");
  assert(svg.includes('transform="rotate(-35'), "Expected rotated link segments in icon");
  assert(svg.includes('<line') && svg.includes('stroke="' + urlNodeColor + '"'), "Expected connector line for chain-link icon with font color");
  // Verify anchor structure exists
  assert(svg.includes("<a ") && svg.includes("</a>"), "Expected anchor elements wrapping the URL icon");
  // Verify node rectangles still exist (nodes should be clickable normally, not via link)
  const rects = (svg.match(/<rect/g) || []).length;
  assert(rects >= 3, "Expected at least 3 rectangles (background + nodes)");
}

function testCurvedConnectionsRenderAsSvgPaths() {
  const root = makeNode("root", "Root", {
    layout: { offset: { x: 0, y: 0 } }
  });
  const childA = makeNode("a", "Alpha", {
    layout: { offset: { x: 180, y: 80 } }
  });
  const childB = makeNode("b", "Beta", {
    layout: { offset: { x: -180, y: 120 } }
  });
  root.addChild(childA);
  root.addChild(childB);

  const doc = {
    mindmap: {
      getRoot() {
        return root;
      }
    },
    getConnectedNodes() {
      return [{
        from: "a",
        to: "b",
        style: "solid",
        shape: "curved",
        arrow: "2",
        color: "#0055aa",
        curve1T: 0.2,
        curve1N: 0.35,
        curve2T: 0.8,
        curve2N: -0.3
      }];
    }
  };

  const svg = buildRenderer().render(doc);
  assert(svg.includes('stroke="#0055aa"'), "Expected curved connector stroke color in SVG");
  assert(svg.includes(' C '), "Expected cubic bezier command for curved connector");
  assert(svg.includes('<polygon '), "Expected arrow polygons for curved connector");
}

function testRootMultiLineTextUsesZeroCoordinates() {
  const root = makeNode("root", "ERKENNTNISTHEORIE\nDenkrichtungen", {
    layout: { offset: { x: 0, y: 0 } }
  });

  const doc = {
    mindmap: {
      getRoot() {
        return root;
      }
    },
    getConnectedNodes() {
      return [];
    }
  };

  const svg = buildRenderer().render(doc);
  assert(svg.includes('x="0" y="0" width="'), "Expected root SVG background to use zero coordinates");
  assert(svg.includes('<tspan x="0" y="32">ERKENNTNISTHEORIE</tspan>'), "Expected first root-line tspan to preserve x coordinate");
  assert(svg.includes('<tspan x="0" y="47">Denkrichtungen</tspan>'), "Expected second root-line tspan to preserve x coord");
}

(function run() {
  const tests = [testBasicVectorOutput, testMalformedDataDoesNotThrow, testNodeUrlsAreClickableInSvg, testCurvedConnectionsRenderAsSvgPaths, testRootMultiLineTextUsesZeroCoordinates];
  let passed = 0;

  tests.forEach((fn) => {
    fn();
    passed += 1;
    console.log("PASS", fn.name);
  });

  console.log("All SVG export tests passed:", passed);
})();
