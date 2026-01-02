![QBS icon](public/qbk-128.png)

# QBS — Quick Bookmark Search

A lightweight Chrome extension for searching and opening bookmarks entirely from the keyboard.

## Key features

- **Global keyboard shortcut** to open the popup anytime (`Alt+G` by default; you can change it in Chrome’s extension shortcuts)
- **Keyboard-centric navigation**
  - Type to search
  - Arrow keys or `Ctrl+N` / `Ctrl+P` to move through results
  - `Enter` to open the selected result
  - `Home` / `End` to jump to first/last result
- **Accessibility support**
  - Selection properly tracked for screenreaders.
  - Live region status updates for screen reader.
- **Fast and lightweight**
  - No UI frameworks
  - Uses native DOM APIs.
- **Open source and Tracker free**
  - Source code is acailable at github.com/claudio4/qbs-quick-bookmark-search.
  - No trackers nor connections to external services.

### Changing the shortcut
Go to:
`chrome://extensions/shortcuts`
and set a custom shortcut for **QBS**.

## Permissions (and why they’re needed)

- **`bookmarks`**
  - Required to read your bookmark tree, list recent bookmarks, and perform bookmark search queries.

- **`favicon`**
  - Required to display favicons next to results using Chrome’s internal `/_favicon/` endpoint.

- **`activeTab`**
  - Required only when opening **bookmarklets** (`javascript:` URLs). QBS needs access to the currently active tab to run the bookmarklet in the page context (similar to clicking it from the bookmarks bar).

- **`scripting`**
  - Required to execute bookmarklet code in the active tab via `chrome.scripting.executeScript`. Normal bookmarks are opened by creating a new tab and do not require script injection.

## Development

- Build:
  - `npm run build`
