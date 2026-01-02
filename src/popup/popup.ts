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

    li.addEventListener("click", () => openBookmark(b.url));
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
      if (b) openBookmark(b.url);
      break;
    case "Home":
      setSelected(0);
      break;
    case "End":
      setSelected(bookmarks.length - 1);
      break;
  }
}

async function openBookmark(url: string) {
  if (url.startsWith("javascript:")) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id) return;
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      world: "MAIN",
      func: (code) => {
        // This mimics the behavior of clicking a bookmarklet in the bar.
        window.location.href = code;
      },
      args: [url],
    });
  } else {
    chrome.tabs.create({ url });
  }
  window.close();
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
