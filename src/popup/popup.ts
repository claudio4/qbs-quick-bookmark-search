/// <reference types="trusted-types" />

declare global {
  interface Window {
    QBS_Policy: any;
  }
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  dateAdded?: number;
}

const input = document.getElementById("search-input") as HTMLInputElement;
const resultsList = document.getElementById("results-list") as HTMLDivElement;
const a11yStatus = document.getElementById("a11y-status") as HTMLDivElement;

let bookmarks: SearchResult[] = [];

updateShortcutHint();
loadDefaultView();

input.addEventListener("input", () => {
  const query = input.value.trim();
  if (query.length === 0) {
    loadDefaultView();
  } else {
    performSearch(query);
  }
});
input.addEventListener("keydown", handleNavigation);

async function loadDefaultView() {
  const tree = await chrome.bookmarks.getTree();

  // In Chrome, the root (id:0) usually has children:
  // id:1 = Bookmarks Bar
  // id:2 = Other Bookmarks
  // id:3 = Mobile Bookmarks
  const bookmarksBar = tree[0].children?.find((n) => n.id === "1");
  if (!bookmarksBar || !bookmarksBar.children) {
    const results = await chrome.bookmarks.getRecent(50);
    bookmarks = processBookmarks(results);
    renderResults();
    return;
  }

  // bookmarks has url, folder ha no url
  const pages = bookmarksBar.children.filter((n) => n.url);
  const folders = bookmarksBar.children.filter((n) => !n.url);

  const folderContents = flattenNodes(folders);

  // put straight bookmarks first, then the ones contained in folders.
  bookmarks = processBookmarks([...pages, ...folderContents]);
  renderResults();
}

async function performSearch(query: string) {
  const results = await chrome.bookmarks.search(query);
  bookmarks = processBookmarks(results);
  renderResults();
}

function processBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]): SearchResult[] {
  return nodes
    .filter((b) => b.url) // Must have URL
    .map((b) => ({
      id: b.id,
      title: b.title || extractDomain(b.url!) || "Untitled",
      url: b.url!,
      dateAdded: b.dateAdded,
    }));
}

function renderResults() {
  // we reset the index to -1 because the currently selected element is going to disappear.
  selectedIndex = -1;

  if (bookmarks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No bookmarks found";
    li.className = "not-found";
    resultsList.replaceChildren(li);
    a11yStatus.textContent = "No bookmarks found";
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    return;
  }

  input.setAttribute("aria-expanded", "true");
  {
    const a11yStatusContent = input.value.length === 0 ? "Recent bookmarks" : `${bookmarks.length} results found`;
    if (a11yStatusContent !== a11yStatus.textContent) a11yStatus.textContent = a11yStatusContent;
  }

  const elements = bookmarks.map((b, i) => {
    const li = document.createElement("li");
    const itemId = `result-option-${i}`;

    li.id = itemId;
    li.role = "option";
    li.setAttribute("aria-selected", "false");
    li.setAttribute("aria-label", b.title);

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "icon-wrapper";

    const icon = document.createElement("img");
    icon.src = getFaviconUrl(b.url);
    icon.onerror = handleImgErrorLoad;
    icon.alt = "";

    const content = document.createElement("div");
    content.className = "content";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = b.title;

    const url = document.createElement("div");
    url.className = "url";
    url.textContent = cleanUrlDisplay(b.url);

    content.appendChild(title);
    content.appendChild(url);
    iconWrapper.appendChild(icon);
    li.appendChild(iconWrapper);
    li.appendChild(content);

    li.addEventListener("click", (e) => openBookmark(b.url, e.ctrlKey));
    li.addEventListener("mousedown", (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      openBookmark(b.url, true);
    });
    li.addEventListener("mouseenter", () => {
      setSelected(i);
    });

    return li;
  }) as Node[];

  resultsList.replaceChildren(...elements);
  setSelected(0);
}

let selectedIndex = -1;
function setSelected(idx: number) {
  if (selectedIndex != -1) {
    document.getElementById(`result-option-${selectedIndex}`)?.setAttribute("aria-selected", "false");
  }

  selectedIndex = idx;
  if (idx == -1) {
    return;
  }

  const activeItem = document.getElementById(`result-option-${idx}`);
  if (!activeItem) {
    input.removeAttribute("aria-activedescendant");
    return;
  }

  activeItem?.setAttribute("aria-selected", "true");
  input.setAttribute("aria-activedescendant", activeItem.id);
  activeItem.scrollIntoView({ block: "nearest" });
}

function handleNavigation(e: KeyboardEvent) {
  if (bookmarks.length === 0) return;

  switch (e.key) {
    // @ts-expect-error
    case "n":
      if (!e.ctrlKey) return;
    case "ArrowDown":
      e.preventDefault();
      setSelected((selectedIndex + 1) % bookmarks.length);
      break;
    // @ts-expect-error
    case "p":
      if (!e.ctrlKey) return;
    case "ArrowUp":
      e.preventDefault();
      setSelected((selectedIndex - 1 + bookmarks.length) % bookmarks.length);
      break;
    case "Enter":
      e.preventDefault();
      if (selectedIndex < 0) return;
      const b = bookmarks[selectedIndex];
      if (b) openBookmark(b.url, e.ctrlKey);
      break;
    case "Home":
      setSelected(0);
      break;
    case "End":
      setSelected(bookmarks.length - 1);
      break;
  }
}

async function openBookmark(url: string, openInNewTab: boolean) {
  const jsPrefix = "javascript:";
  if (url.startsWith(jsPrefix)) {
    let code;
    try {
      code = decodeURI(url.substring(jsPrefix.length));
    } catch (err) {
      code = url.substring(jsPrefix.length);
    }

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id) return;
    if (chrome.userScripts) {
      await executeInTabWithUserScript(activeTab.id, code);
    } else {
      await executeInTabWithExecuteScript(activeTab.id, code);
    }
  } else if (openInNewTab) {
    chrome.tabs.create({ url });
  } else {
    chrome.tabs.update({ url });
  }
  window.close();
}

async function executeInTabWithUserScript(tabId: number, code: string) {
  return chrome.userScripts.execute({
    target: { tabId },
    js: [{ code }],
  });
}

function executeInTabWithExecuteScript(tabId: number, code: string) {
  return chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (scriptCode) => {
      try {
        const script = document.createElement("script");

        //  CSP BYPASS (Nonce Stealing)
        const existingScript = document.querySelector("script[nonce]");
        if (existingScript) {
          const nonce = existingScript.getAttribute("nonce");
          if (nonce) {
            script.setAttribute("nonce", nonce);
          }
        }

        //  TRUSTED TYPES BYPASS
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
          try {
            // Try to create a policy to sanitize (or in this case, pass-through) the code
            // Note: Some sites strictly block policy creation via CSP.
            // If 'qbs-policy' is blocked, this will throw, and we catch it below.
            if (!window.QBS_Policy) {
              window.QBS_Policy = window.trustedTypes.createPolicy("qbs-policy", {
                createScript: (s: string) => s,
              });
            }

            // Assign using the created policy
            script.textContent = window.QBS_Policy.createScript(scriptCode) as unknown as string;
          } catch (e) {
            // Fallback: If policy creation failed (blocked by CSP),
            // we try raw assignment, though it will likely fail on the same sites.
            console.warn(
              "QBS: Trusted Type Policy creation blocked. Try enabling the userscript permission on the extension.",
              e,
            );
            script.textContent = scriptCode;
          }
        } else {
          // Standard assignment for sites without Trusted Types
          script.textContent = scriptCode;
        }

        // 4. Inject and Cleanup
        (document.head || document.documentElement).appendChild(script);
        script.remove();
      } catch (e) {
        console.error(e);
      }
      console.warn(
        "%c⚠️ QBS: Standard Bookmarklet Execution Mode%c\n\n" +
          "This bookmarklet is running in standard mode, which may fail on some websites with strict security policies.\n\n" +
          "For full site compatibility, enable the enhanced mode by granting the 'userscripts' permission.\n\n" +
          "Learn more: https://github.com/claudio4/qbs-quick-bookmark-search#bookmarklet-execution-modes",
        "background: #ff6b6b; color: white; font-weight: bold; font-size: 14px; padding: 8px 12px; border-radius: 4px;",
        "font-size: 12px; padding: 4px;",
      );
    },
    args: [code],
  });
}

async function updateShortcutHint() {
  const commands = await chrome.commands.getAll();

  // '_execute_action' is the internal name for the main extension click/shortcut
  const actionCommand = commands.find((c) => c.name === "_execute_action");

  const shortcutHint = document.getElementById("shortcut-hint");
  if (!shortcutHint) return;

  if (actionCommand && actionCommand.shortcut) {
    shortcutHint.textContent = actionCommand.shortcut;
  } else {
    shortcutHint.style.display = "none";
  }
}

// --- Helpers ---

function handleImgErrorLoad(e: Event | string) {
  if (typeof e === "string") return;
  (e.currentTarget as HTMLElement).style.opacity = "0";
}

function getFaviconUrl(u: string) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "16");
  return url.toString();
}

function cleanUrlDisplay(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    // Returns "domain.com - /path/..." or just domain
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch (e) {
    return urlStr;
  }
}

function extractDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch (e) {
    return "";
  }
}

function flattenNodes(nodes: chrome.bookmarks.BookmarkTreeNode[]): chrome.bookmarks.BookmarkTreeNode[] {
  let results: chrome.bookmarks.BookmarkTreeNode[] = [];

  for (const node of nodes) {
    if (node.url) {
      results.push(node);
    } else if (node.children) {
      // Depth-first traversal
      results = results.concat(flattenNodes(node.children));
    }
  }

  return results;
}
