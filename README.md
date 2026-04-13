# Mindix (Mind Map Maker)

## Attribution

This project is based on [mindmaps](https://github.com/drichard/mindmaps) by [David Richard](https://github.com/drichard), which is the original open-source mind map application. The project was subsequently extended by [cormar](https://github.com/cormar/Mind-Map-Maker), and further developed in this fork.

## Development

### Requirements
Devenv installed https://devenv.sh/getting-started/

### Getting Started

1. Activate the development shell:

```bash
devenv shell
```

2. Start a local web server:

```bash
php -S localhost:8080
```

3. Open the app:

http://localhost:8080/index.html

## Storage and Compatibility Overview

The app supports two local persistence modes:

1. Browser storage (default)
- Primary backend: IndexedDB
- Automatic fallback: localStorage (only when IndexedDB is unavailable)
- Works across modern browsers
- Best for always-available autosave in-browser workflows

2. Linked local file storage (optional)
- Uses the browser File System Access API to keep writing to the same local file
- Full support in Chromium-based browsers that expose both file pickers
- Brave Browser supports the File System Access API but disables it by default due to privacy and security concerns, despite being based on Chromium. You can enable it manually via brave://flags/#file-system-access-api and restart the browser.
- Not available in Safari

### Browser behavior summary

1. Chrome
- IndexedDB: supported
- Linked files: full support (open + save pickers)

2. Safari
- IndexedDB: supported
- Linked files: unavailable for this workflow

### In-app fallback behavior

1. If linked files are unavailable, use browser storage (IndexedDB) plus manual export/import.
2. The Save/Open dialogs show a live capability status for linked files.

## How to verify active browser storage backend

Run in browser console:

```javascript
await mindmaps.LocalDocumentStorage.getBackendDiagnostics()
```

Expected fields:
- `activeBackend`: `indexedDB` or `localStorage`
- `indexedDbDocuments`: number of docs in IndexedDB
- `localStorageDocuments`: number of legacy docs in localStorage

## Keyboard Shortcuts

### Node editing
| Action | Mac | Windows/Linux |
|---|---|---|
| Create child node | Tab / Insert | Tab / Insert |
| Create sibling node | Enter | Enter |
| Delete node | Del / Backspace | Del / Backspace |
| Edit node caption | F2 | F2 |
| Toggle fold children | Space | Space |
| **Bold** | **⌘B** | **Ctrl+B** |
| *Italic* | **⌘I** | **Ctrl+I** |
| Underline | **⌘U** | **Ctrl+U** |
| Strikethrough | **⌘⇧X** | **Ctrl+Shift+X** |

### Navigation
| Action | Mac | Windows/Linux |
|---|---|---|
| Go to parent | — | — |
| Go to first child | — | — |
| Go to next sibling | — | — |
| Go to prev sibling | — | — |

### Document
| Action | Mac | Windows/Linux |
|---|---|---|
| Save (browser storage) | ⌘S | Ctrl+S |
| Save As… | ⌘A | Ctrl+A |
| Open | ⌘O | Ctrl+O |
| Print | ⌘P | Ctrl+P |
| Undo | ⌘Z | Ctrl+Z |
| Redo | ⌘⇧Z | Ctrl+Y |
| Copy branch | ⌘C | Ctrl+C |
| Cut branch | ⌘X | Ctrl+X |
| Paste branch | ⌘V | Ctrl+V |

## Requirements

- A simple web server to serve the app.
- Extract files to your web root.


