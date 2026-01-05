<p >
  <a href="https://chromewebstore.google.com/detail/qbs-quick-bookmark-search/dkdnhpalgggigjeoalgfhbnfbpealheg"><img src="public/qbk-128.png" width="128" alt="QBS icon" /></a>
  <a href="https://chromewebstore.google.com/detail/qbs-quick-bookmark-search/dkdnhpalgggigjeoalgfhbnfbpealheg"><img src="https://developer.chrome.com/static/docs/webstore/branding/image/UV4C4ybeBTsZt43U4xis.png" /></a>
</a>

# QBS — Quick Bookmark Search

A lightweight Chrome extension for searching and opening bookmarks entirely from the keyboard.

## Features

- **Global keyboard shortcut** — Open the popup anytime with `Alt+G` (customizable in Chrome's extension shortcuts)
- **Keyboard navigation** — Arrow keys or `Ctrl+N`/`Ctrl+P` to navigate, `Enter` to open, `Home`/`End` to jump
- **Bookmarklet support** — Execute bookmarklets (`javascript:` URLs) directly from search results
- **Accessibility** — Full screen reader support with live region updates
- **Fast and lightweight** — No UI frameworks, uses native DOM APIs
- **Privacy focused** — No trackers or external connections

### Customizing the keyboard shortcut

Navigate to `chrome://extensions/shortcuts` and set your preferred shortcut for QBS.

## Permissions

QBS requires the following permissions:

- **`bookmarks`** — Read your bookmark tree and perform searches
- **`favicon`** — Display site icons next to results using Chrome's internal favicon API
- **`activeTab`** — Access the current tab when executing bookmarklets or changing URLs
- **`scripting`** — Inject bookmarklet code into the active tab
- **`userScripts`** (optional) — Enhanced bookmarklet execution with better compatibility

### Bookmarklet execution modes

QBS supports two methods for executing bookmarklets:

1. **Standard mode** (using `scripting` permission) — Works out of the box but may fail on pages with strict Content Security Policy (CSP) or Trusted Types restrictions
2. **Enhanced mode** (using `userScripts` permission) — Bypasses most CSP restrictions for reliable execution on all sites

### Enabling userScripts (recommended for bookmarklet users)

The `userScripts` permission is optional but highly recommended if you use bookmarklets. To enable it:

1. Navigate to `chrome://extensions`
2. Find QBS in your extensions list
3. Click on "Details"
4. Scroll down to "Permissions"
5. Enable the "User Scripts" permission if available

**Why enable userScripts?**

Many modern websites use strict security policies that prevent scripts from running. The `userScripts` API allows QBS to execute bookmarklets reliably even on these protected pages. Without it, bookmarklets may fail silently on sites like Gmail, GitHub, or banking websites.

If the `userScripts` permission is not granted, QBS will automatically fall back to the standard method, which includes workarounds for CSP and Trusted Types but may still fail on heavily restricted sites.

## Development

Intall dependencies
```
npm install
```

Build the extension:

```
npm run build
```

Load the extension in Chrome:

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" using the toggle in the top right corner
3. Click "Load unpacked"
4. Select the `dist` folder (not the root repository folder) from your local build


## Source Code

Available at [github.com/claudio4/qbs-quick-bookmark-search](https://github.com/claudio4/qbs-quick-bookmark-search) under MIT license.

## License

This source is freely distributed under the MIT license. Check the [LICENSE](LICENSE) file for details.
