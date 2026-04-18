/**
 * Unit tests for UndoManager and UndoManager.CircularStack
 */

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

// ─── CircularStack ────────────────────────────────────────────────────────────

function testCircularStackIsEmptyOnCreation() {
  const { UndoManager } = buildContext();
  const stack = new UndoManager.CircularStack(5);
  assert(stack.isEmpty(), "Newly created stack must be empty");
  assert.strictEqual(stack.peek(), null, "Peek on empty stack returns null");
  assert.strictEqual(stack.pop(), null, "Pop on empty stack returns null");
}

function testCircularStackPushAndPop() {
  const { UndoManager } = buildContext();
  const stack = new UndoManager.CircularStack(5);
  stack.push("a");
  assert(!stack.isEmpty());
  assert.strictEqual(stack.pop(), "a");
  assert(stack.isEmpty(), "Stack should be empty after popping last item");
}

function testCircularStackLIFOOrder() {
  const { UndoManager } = buildContext();
  const stack = new UndoManager.CircularStack(10);
  stack.push(1);
  stack.push(2);
  stack.push(3);
  assert.strictEqual(stack.pop(), 3, "LIFO: last pushed is first popped");
  assert.strictEqual(stack.pop(), 2);
  assert.strictEqual(stack.pop(), 1);
  assert(stack.isEmpty());
}

function testCircularStackPeekIsNonDestructive() {
  const { UndoManager } = buildContext();
  const stack = new UndoManager.CircularStack(5);
  stack.push("x");
  stack.push("y");
  assert.strictEqual(stack.peek(), "y");
  assert.strictEqual(stack.peek(), "y", "Peek must not remove items");
  assert.strictEqual(stack.pop(), "y");
  assert.strictEqual(stack.pop(), "x");
}

function testCircularStackClear() {
  const { UndoManager } = buildContext();
  const stack = new UndoManager.CircularStack(5);
  stack.push(1);
  stack.push(2);
  stack.clear();
  assert(stack.isEmpty(), "Stack must be empty after clear");
  assert.strictEqual(stack.peek(), null);
}

function testCircularStackWrapsAroundMaxSize() {
  const { UndoManager } = buildContext();
  const stack = new UndoManager.CircularStack(3);
  stack.push("a");
  stack.push("b");
  stack.push("c");
  // This push wraps around and overwrites the oldest entry ("a")
  stack.push("d");
  assert.strictEqual(stack.pop(), "d");
  assert.strictEqual(stack.pop(), "c");
  assert.strictEqual(stack.pop(), "b");
  // "a" was overwritten by the circular wrap
}

function testCircularStackClearThenPushWorks() {
  const { UndoManager } = buildContext();
  const stack = new UndoManager.CircularStack(5);
  stack.push("before");
  stack.clear();
  stack.push("after");
  assert.strictEqual(stack.pop(), "after");
  assert(stack.isEmpty());
}

// ─── UndoManager ─────────────────────────────────────────────────────────────

function testUndoManagerInitialState() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  assert(!mgr.canUndo(), "canUndo must be false initially");
  assert(!mgr.canRedo(), "canRedo must be false initially");
}

function testAddUndoEnablesCanUndo() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  mgr.addUndo(() => {}, () => {});
  assert(mgr.canUndo(), "canUndo must be true after addUndo");
  assert(!mgr.canRedo(), "canRedo must still be false after addUndo");
}

function testUndoCallsUndoFunction() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  let state = 0;
  mgr.addUndo(() => { state--; }, () => { state++; });
  state++;
  mgr.undo();
  assert.strictEqual(state, 0, "undo() must invoke the undo callback");
}

function testRedoCallsRedoFunction() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  let state = 0;
  mgr.addUndo(() => { state--; }, () => { state++; });
  state++;
  mgr.undo();
  assert.strictEqual(state, 0);
  mgr.redo();
  assert.strictEqual(state, 1, "redo() must invoke the redo callback");
}

function testUndoEnablesCanRedoAfterwards() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  mgr.addUndo(() => {}, () => {});
  mgr.undo();
  assert(!mgr.canUndo());
  assert(mgr.canRedo(), "canRedo must be true after an undo");
}

function testRedoClearsCanRedo() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  mgr.addUndo(() => {}, () => {});
  mgr.undo();
  mgr.redo();
  assert(!mgr.canRedo(), "canRedo must be false after exhausting the redo stack");
}

function testAddUndoAfterUndoClearsRedoStack() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  let a = 0;
  mgr.addUndo(() => { a--; }, () => { a++; });
  a++;
  mgr.undo();
  assert(mgr.canRedo(), "canRedo before branching");
  // A new action should discard the existing redo stack
  mgr.addUndo(() => { a -= 10; }, () => { a += 10; });
  a += 10;
  assert(!mgr.canRedo(), "New action must clear the redo stack");
}

function testMultipleUndoRedoCycles() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  let state = 0;

  // Push 3 actions
  for (let i = 1; i <= 3; i++) {
    const delta = i;
    mgr.addUndo(() => { state -= delta; }, () => { state += delta; });
    state += delta;
  }
  assert.strictEqual(state, 6, "state after 3 increments = 1+2+3 = 6");

  // Undo all three
  mgr.undo(); // undoes +3
  assert.strictEqual(state, 3);
  mgr.undo(); // undoes +2
  assert.strictEqual(state, 1);
  mgr.undo(); // undoes +1
  assert.strictEqual(state, 0);
  assert(!mgr.canUndo());

  // Redo all three
  mgr.redo(); assert.strictEqual(state, 1);
  mgr.redo(); assert.strictEqual(state, 3);
  mgr.redo(); assert.strictEqual(state, 6);
  assert(!mgr.canRedo());
}

function testUndoDoesNothingWhenEmpty() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  // Should not throw
  mgr.undo();
  assert(!mgr.canUndo());
  assert(!mgr.canRedo());
}

function testRedoDoesNothingWhenEmpty() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  mgr.redo();
  assert(!mgr.canRedo());
}

function testResetClearsAllState() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  mgr.addUndo(() => {}, () => {});
  mgr.reset();
  assert(!mgr.canUndo(), "canUndo must be false after reset");
  assert(!mgr.canRedo(), "canRedo must be false after reset");
}

function testStateChangedFiredOnAddUndo() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  let calls = 0;
  mgr.stateChanged = () => { calls++; };
  mgr.addUndo(() => {}, () => {});
  assert(calls > 0, "stateChanged must fire after addUndo");
}

function testStateChangedFiredOnUndoAndRedo() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  let calls = 0;
  mgr.addUndo(() => {}, () => {});
  mgr.stateChanged = () => { calls++; };
  mgr.undo();
  assert(calls > 0, "stateChanged must fire on undo");
  const afterUndo = calls;
  mgr.redo();
  assert(calls > afterUndo, "stateChanged must fire on redo");
}

function testStateChangedFiredOnReset() {
  const { UndoManager } = buildContext();
  const mgr = new UndoManager(10);
  let calls = 0;
  mgr.stateChanged = () => { calls++; };
  mgr.reset();
  assert(calls > 0, "stateChanged must fire on reset");
}

// ─── Runner ───────────────────────────────────────────────────────────────────

(function run() {
  const tests = [
    testCircularStackIsEmptyOnCreation,
    testCircularStackPushAndPop,
    testCircularStackLIFOOrder,
    testCircularStackPeekIsNonDestructive,
    testCircularStackClear,
    testCircularStackWrapsAroundMaxSize,
    testCircularStackClearThenPushWorks,
    testUndoManagerInitialState,
    testAddUndoEnablesCanUndo,
    testUndoCallsUndoFunction,
    testRedoCallsRedoFunction,
    testUndoEnablesCanRedoAfterwards,
    testRedoClearsCanRedo,
    testAddUndoAfterUndoClearsRedoStack,
    testMultipleUndoRedoCycles,
    testUndoDoesNothingWhenEmpty,
    testRedoDoesNothingWhenEmpty,
    testResetClearsAllState,
    testStateChangedFiredOnAddUndo,
    testStateChangedFiredOnUndoAndRedo,
    testStateChangedFiredOnReset,
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

  console.log(`\nUndoManager: ${passed}/${tests.length} tests passed`);
})();
