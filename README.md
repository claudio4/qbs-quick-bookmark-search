![QBS icon](public/qbk-128.png)

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
- **`activeTab`** — Access the current tab to change its URL and when executing bookmarklets
- **`scripting`** — Inject bookmarklet code into the active tab

### Why activeTab and scripting?

When you open a bookmarklet (a bookmark with a `javascript:` URL), QBS must execute that code in the context of your current page, just like clicking it from the bookmarks bar. This requires temporary access to the active tab and the ability to run scripts in it. Regular bookmarks simply open in a new tab without requiring these permissions.

## Development

Build the extension:

```
npm run build
```

## Source Code

Available at [github.com/claudio4/qbs-quick-bookmark-search](https://github.com/claudio4/qbs-quick-bookmark-search)

## License

See [LICENSE](LICENSE) file for details.
