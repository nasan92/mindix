const { test, describe } = require("node:test");
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function buildContext() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "UndoManager.js"),
    "utf8"
  );
  const context = { console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

// Build context once — UndoManager class has no shared state between instances
const { UndoManager } = buildContext();

// ─── CircularStack ────────────────────────────────────────────────────────────

describe("CircularStack", () => {
  test("is empty on creation", () => {
    const stack = new UndoManager.CircularStack(5);
    assert(stack.isEmpty(), "Newly created stack must be empty");
    assert.strictEqual(stack.peek(), null, "Peek on empty stack returns null");
    assert.strictEqual(stack.pop(), null, "Pop on empty stack returns null");
  });

  test("push and pop", () => {
    const stack = new UndoManager.CircularStack(5);
    stack.push("a");
    assert(!stack.isEmpty());
    assert.strictEqual(stack.pop(), "a");
    assert(stack.isEmpty(), "Stack should be empty after popping last item");
  });

  test("LIFO order", () => {
    const stack = new UndoManager.CircularStack(10);
    stack.push(1);
    stack.push(2);
    stack.push(3);
    assert.strictEqual(stack.pop(), 3, "LIFO: last pushed is first popped");
    assert.strictEqual(stack.pop(), 2);
    assert.strictEqual(stack.pop(), 1);
    assert(stack.isEmpty());
  });

  test("peek is non-destructive", () => {
    const stack = new UndoManager.CircularStack(5);
    stack.push("x");
    stack.push("y");
    assert.strictEqual(stack.peek(), "y");
    assert.strictEqual(stack.peek(), "y", "Peek must not remove items");
    assert.strictEqual(stack.pop(), "y");
    assert.strictEqual(stack.pop(), "x");
  });

  test("clear empties the stack", () => {
    const stack = new UndoManager.CircularStack(5);
    stack.push(1);
    stack.push(2);
    stack.clear();
    assert(stack.isEmpty(), "Stack must be empty after clear");
    assert.strictEqual(stack.peek(), null);
  });

  test("wraps around at max size, discarding oldest entry", () => {
    const stack = new UndoManager.CircularStack(3);
    stack.push("a");
    stack.push("b");
    stack.push("c");
    stack.push("d"); // overwrites "a"
    assert.strictEqual(stack.pop(), "d");
    assert.strictEqual(stack.pop(), "c");
    assert.strictEqual(stack.pop(), "b");
    // "a" was overwritten by the circular wrap
  });

  test("clear then push works correctly", () => {
    const stack = new UndoManager.CircularStack(5);
    stack.push("before");
    stack.clear();
    stack.push("after");
    assert.strictEqual(stack.pop(), "after");
    assert(stack.isEmpty());
  });
});

// ─── UndoManager ─────────────────────────────────────────────────────────────

describe("UndoManager", () => {
  test("initial state: canUndo and canRedo are false", () => {
    const mgr = new UndoManager(10);
    assert(!mgr.canUndo(), "canUndo must be false initially");
    assert(!mgr.canRedo(), "canRedo must be false initially");
  });

  test("addUndo enables canUndo", () => {
    const mgr = new UndoManager(10);
    mgr.addUndo(() => {}, () => {});
    assert(mgr.canUndo(), "canUndo must be true after addUndo");
    assert(!mgr.canRedo(), "canRedo must still be false after addUndo");
  });

  test("undo calls the undo callback", () => {
    const mgr = new UndoManager(10);
    let state = 0;
    mgr.addUndo(() => { state--; }, () => { state++; });
    state++;
    mgr.undo();
    assert.strictEqual(state, 0, "undo() must invoke the undo callback");
  });

  test("redo calls the redo callback", () => {
    const mgr = new UndoManager(10);
    let state = 0;
    mgr.addUndo(() => { state--; }, () => { state++; });
    state++;
    mgr.undo();
    assert.strictEqual(state, 0);
    mgr.redo();
    assert.strictEqual(state, 1, "redo() must invoke the redo callback");
  });

  test("undo enables canRedo afterwards", () => {
    const mgr = new UndoManager(10);
    mgr.addUndo(() => {}, () => {});
    mgr.undo();
    assert(!mgr.canUndo());
    assert(mgr.canRedo(), "canRedo must be true after an undo");
  });

  test("redo clears canRedo when exhausted", () => {
    const mgr = new UndoManager(10);
    mgr.addUndo(() => {}, () => {});
    mgr.undo();
    mgr.redo();
    assert(!mgr.canRedo(), "canRedo must be false after exhausting the redo stack");
  });

  test("addUndo after undo clears the redo stack", () => {
    const mgr = new UndoManager(10);
    let a = 0;
    mgr.addUndo(() => { a--; }, () => { a++; });
    a++;
    mgr.undo();
    assert(mgr.canRedo(), "canRedo before branching");
    mgr.addUndo(() => { a -= 10; }, () => { a += 10; });
    a += 10;
    assert(!mgr.canRedo(), "New action must clear the redo stack");
  });

  test("multiple undo/redo cycles", () => {
    const mgr = new UndoManager(10);
    let state = 0;

    for (let i = 1; i <= 3; i++) {
      const delta = i;
      mgr.addUndo(() => { state -= delta; }, () => { state += delta; });
      state += delta;
    }
    assert.strictEqual(state, 6, "state after 3 increments = 1+2+3 = 6");

    mgr.undo(); assert.strictEqual(state, 3);
    mgr.undo(); assert.strictEqual(state, 1);
    mgr.undo(); assert.strictEqual(state, 0);
    assert(!mgr.canUndo());

    mgr.redo(); assert.strictEqual(state, 1);
    mgr.redo(); assert.strictEqual(state, 3);
    mgr.redo(); assert.strictEqual(state, 6);
    assert(!mgr.canRedo());
  });

  test("undo does nothing when stack is empty", () => {
    const mgr = new UndoManager(10);
    mgr.undo();
    assert(!mgr.canUndo());
    assert(!mgr.canRedo());
  });

  test("redo does nothing when stack is empty", () => {
    const mgr = new UndoManager(10);
    mgr.redo();
    assert(!mgr.canRedo());
  });

  test("reset clears all state", () => {
    const mgr = new UndoManager(10);
    mgr.addUndo(() => {}, () => {});
    mgr.reset();
    assert(!mgr.canUndo(), "canUndo must be false after reset");
    assert(!mgr.canRedo(), "canRedo must be false after reset");
  });

  test("stateChanged fires on addUndo", () => {
    const mgr = new UndoManager(10);
    let calls = 0;
    mgr.stateChanged = () => { calls++; };
    mgr.addUndo(() => {}, () => {});
    assert(calls > 0, "stateChanged must fire after addUndo");
  });

  test("stateChanged fires on undo and redo", () => {
    const mgr = new UndoManager(10);
    let calls = 0;
    mgr.addUndo(() => {}, () => {});
    mgr.stateChanged = () => { calls++; };
    mgr.undo();
    assert(calls > 0, "stateChanged must fire on undo");
    const afterUndo = calls;
    mgr.redo();
    assert(calls > afterUndo, "stateChanged must fire on redo");
  });

  test("stateChanged fires on reset", () => {
    const mgr = new UndoManager(10);
    let calls = 0;
    mgr.stateChanged = () => { calls++; };
    mgr.reset();
    assert(calls > 0, "stateChanged must fire on reset");
  });
});
