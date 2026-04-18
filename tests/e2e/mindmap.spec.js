// @ts-check
const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wait for the Mindix app to finish initialising.
 * The app renders mind map nodes as DOM elements inside #drawing-area,
 * not on a <canvas> element. We wait for the toolbar and the root node div.
 */
async function waitForAppReady(page) {
  await expect(page.locator("#toolbar")).toBeVisible();
  await expect(page.locator("#drawing-area .node-container.root")).toBeVisible();
}

/**
 * Click the toolbar button for the given command id.
 * Button ids follow the pattern: #button-<COMMAND_ID>
 */
function toolbarBtn(page, commandId) {
  return page.locator(`#button-${commandId}`);
}

/**
 * Open a toolbar dropdown menu (e.g. "File" or "Edit") and then click
 * a command button inside it. The menu buttons have no IDs — they are
 * identified by their visible text label.
 */
async function openMenuAndClick(page, menuLabel, commandId) {
  // Find the menu toggle button by its text content (e.g. "File", "Edit")
  const menuToggle = page.locator(`.menu-wrapper button:has-text("${menuLabel}")`).first();
  await menuToggle.click();
  // The .menu div is now visible; click the target command button
  await toolbarBtn(page, commandId).click();
}

// ─── Page load & structure ───────────────────────────────────────────────────

test.describe("App initialisation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("page title contains Mindix", async ({ page }) => {
    await expect(page).toHaveTitle(/mindix/i);
  });

  test("drawing area is visible with at least one node", async ({ page }) => {
    await expect(page.locator("#drawing-area")).toBeVisible();
    await expect(page.locator("#drawing-area .node-container")).toBeVisible();
  });

  test("toolbar is rendered with buttons", async ({ page }) => {
    await expect(page.locator("#toolbar")).toBeVisible();
    // At least one button should be present
    await expect(page.locator("#toolbar button").first()).toBeVisible();
  });

  test("New-document button is registered in toolbar", async ({ page }) => {
    // File-operation buttons live in a collapsible dropdown menu — use toBeAttached
    await expect(toolbarBtn(page, "NEW_DOCUMENT_COMMAND")).toBeAttached();
  });

  test("Export-Markdown button is registered in toolbar", async ({ page }) => {
    await expect(toolbarBtn(page, "EXPORT_MARKDOWN_COMMAND")).toBeAttached();
  });

  test("Import-Markdown button is registered in toolbar", async ({ page }) => {
    await expect(toolbarBtn(page, "IMPORT_MARKDOWN_COMMAND")).toBeAttached();
  });

  test("Undo button is registered in toolbar", async ({ page }) => {
    await expect(toolbarBtn(page, "UNDO_COMMAND")).toBeAttached();
  });

  test("Redo button is registered in toolbar", async ({ page }) => {
    await expect(toolbarBtn(page, "REDO_COMMAND")).toBeAttached();
  });

  test("no JS errors on load", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.reload();
    await waitForAppReady(page);
    // Filter out known non-fatal third-party noise
    const fatal = errors.filter(
      (msg) => !msg.includes("fonts.googleapis") && !msg.includes("favicon")
    );
    expect(fatal).toHaveLength(0);
  });

  test("drawing area fills the viewport", async ({ page }) => {
    const box = await page.locator("#canvas-container").boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(600);
    expect(box.height).toBeGreaterThan(300);
  });

  test("statusbar is visible", async ({ page }) => {
    await expect(page.locator("#statusbar")).toBeVisible();
  });
});

// ─── New document ─────────────────────────────────────────────────────────────

test.describe("New document", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("clicking New opens confirmation dialog or creates blank map", async ({ page }) => {
    await openMenuAndClick(page, "File", "NEW_DOCUMENT_COMMAND");
    // Either a confirmation dialog appears or the map resets; just verify no crash
    await expect(page.locator("#drawing-area")).toBeVisible();
  });
});

// ─── Export Markdown ──────────────────────────────────────────────────────────

test.describe("Export Markdown dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("Export Markdown button opens the export dialog", async ({ page }) => {
    await openMenuAndClick(page, "File", "EXPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#export-markdown-dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test("export dialog contains a textarea with markdown content", async ({ page }) => {
    await openMenuAndClick(page, "File", "EXPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#export-markdown-dialog");
    await expect(dialog).toBeVisible();
    const textarea = dialog.locator("textarea.export-markdown-preview");
    await expect(textarea).toBeVisible();
    const content = await textarea.inputValue();
    // Default map should have at least a root heading
    expect(content).toMatch(/^#\s+/m);
  });

  test("export dialog shows a filename", async ({ page }) => {
    await openMenuAndClick(page, "File", "EXPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#export-markdown-dialog");
    await expect(dialog).toBeVisible();
    const filename = await dialog.locator(".export-markdown-filename").textContent();
    expect(filename).toMatch(/\.md$/);
  });

  test("export dialog can be closed", async ({ page }) => {
    await openMenuAndClick(page, "File", "EXPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#export-markdown-dialog");
    await expect(dialog).toBeVisible();
    // Click the jQuery UI dialog close button
    await page.locator(".ui-dialog-titlebar-close").last().click();
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});

// ─── Import Markdown dialog ───────────────────────────────────────────────────

test.describe("Import Markdown dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("Import Markdown button opens the import dialog", async ({ page }) => {
    await openMenuAndClick(page, "File", "IMPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#import-markdown-dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test("import dialog has a file chooser input", async ({ page }) => {
    await openMenuAndClick(page, "File", "IMPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#import-markdown-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("input[type=file]")).toBeAttached();
  });

  test("uploading a valid markdown file imports the map", async ({ page }) => {
    const md = [
      "# Test Root",
      "",
      "## Alpha",
      "### Sub Alpha",
      "",
      "## Beta",
    ].join("\n");

    await openMenuAndClick(page, "File", "IMPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#import-markdown-dialog");
    await expect(dialog).toBeVisible();

    const fileInput = dialog.locator("input[type=file]");
    await fileInput.setInputFiles({
      name: "test-map.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(md),
    });

    // After successful import the dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 8_000 });
    // Drawing area should still be present with nodes (map was loaded)
    await expect(page.locator("#drawing-area .node-container").first()).toBeVisible();
  });

  test("uploading an invalid file type shows an error message", async ({ page }) => {
    await openMenuAndClick(page, "File", "IMPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#import-markdown-dialog");
    await expect(dialog).toBeVisible();

    await dialog.locator("input[type=file]").setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not markdown"),
    });

    const error = dialog.locator(".import-markdown-error");
    await expect(error).not.toBeEmpty({ timeout: 3_000 });
  });

  test("uploading markdown with no headings shows an error", async ({ page }) => {
    await openMenuAndClick(page, "File", "IMPORT_MARKDOWN_COMMAND");
    const dialog = page.locator("#import-markdown-dialog");
    await expect(dialog).toBeVisible();

    await dialog.locator("input[type=file]").setInputFiles({
      name: "no-headings.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("just some text without headings"),
    });

    const error = dialog.locator(".import-markdown-error");
    await expect(error).not.toBeEmpty({ timeout: 3_000 });
  });
});

// ─── About page ───────────────────────────────────────────────────────────────

test.describe("About page", () => {
  test("about page loads without errors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/about_mindmap.html");
    await expect(page.locator("body")).toBeVisible();
    const fatal = errors.filter(
      (msg) => !msg.includes("fonts.googleapis") && !msg.includes("favicon")
    );
    expect(fatal).toHaveLength(0);
  });
});

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

test.describe("Keyboard shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("pressing Tab on the canvas does not throw an error", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    // Focus the drawing area and press Tab (add child shortcut)
    await page.locator("#drawing-area").click();
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test("Ctrl+Z (undo) does not throw an error", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.locator("#drawing-area").click();
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test("Ctrl+Y (redo) does not throw an error", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.locator("#drawing-area").click();
    await page.keyboard.press("Control+y");
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });
});
