import { firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const grid = document.querySelector("#blog-grid");
const status = document.querySelector("#blog-status");
const article = document.querySelector("#blog-article");
const searchInput = document.querySelector("#blog-search");
const tagBar = document.querySelector("#blog-tags");
document.querySelector("#year").textContent = new Date().getFullYear();
let posts = [];
let activeTag = "all";

function dateLabel(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date) : "Recently";
}

function safeRichContent(markup) {
  const source = new DOMParser().parseFromString(markup || "", "text/html");
  const output = document.createElement("div");
  const allowed = new Set(["P", "BR", "H2", "H3", "H4", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "U", "A", "BLOCKQUOTE", "PRE", "CODE", "DIV"]);
  const copy = (node, parent) => {
    if (node.nodeType === Node.TEXT_NODE) { parent.append(document.createTextNode(node.nodeValue)); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches("div[data-youtube-id]")) {
      const id = node.getAttribute("data-youtube-id");
      if (/^[\w-]{11}$/.test(id || "")) {
        const frame = document.createElement("div"); frame.className = "youtube-frame";
        const iframe = document.createElement("iframe"); iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
        iframe.title = "Embedded YouTube video"; iframe.loading = "lazy"; iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"; iframe.allowFullscreen = true;
        frame.append(iframe); parent.append(frame);
      }
      return;
    }
    if (!allowed.has(node.tagName)) { node.childNodes.forEach(child => copy(child, parent)); return; }
    const clean = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === "A") {
      try { const url = new URL(node.getAttribute("href"), location.href); if (["http:", "https:"].includes(url.protocol)) { clean.href = url.href; clean.rel = "noopener noreferrer"; clean.target = "_blank"; } } catch { }
    }
    node.childNodes.forEach(child => copy(child, clean)); parent.append(clean);
  };
  source.body.childNodes.forEach(node => copy(node, output));
  return output.innerHTML;
}

function renderCards() {
  const term = searchInput.value.trim().toLowerCase();
  const visible = posts.filter(post => {
    const matchesTag = activeTag === "all" || (post.tags || []).includes(activeTag);
    const haystack = `${post.title} ${post.excerpt} ${(post.tags || []).join(" ")}`.toLowerCase();
    return matchesTag && haystack.includes(term);
  });
  grid.replaceChildren();
  if (!visible.length) { status.hidden = false; status.textContent = posts.length ? "No articles match those filters." : "No published articles yet. Check back soon."; return; }
  status.hidden = true;
  for (const post of visible) {
    const card = document.createElement("article"); card.className = "blog-card";
    if (post.coverImage) { const img = document.createElement("img"); img.className = "blog-card-cover"; img.src = post.coverImage; img.alt = ""; img.loading = "lazy"; card.append(img); }
    const content = document.createElement("div"); content.className = "blog-card-content";
    const meta = document.createElement("div"); meta.className = "blog-card-meta"; meta.textContent = `${dateLabel(post.publishedAt || post.updatedAt)} · ${post.readingMinutes || 1} min read`;
    const title = document.createElement("h2"); title.textContent = post.title;
    const excerpt = document.createElement("p"); excerpt.textContent = post.excerpt;
    const tags = document.createElement("div"); tags.className = "blog-card-tags";
    (post.tags || []).slice(0, 3).forEach(tag => { const span = document.createElement("span"); span.textContent = tag; tags.append(span); });
    const link = document.createElement("a"); link.className = "read-link"; link.href = `blog.html?post=${encodeURIComponent(post.id)}`; link.innerHTML = "Read article <i class=\"fa-solid fa-arrow-right\"></i>";
    content.append(meta, title, excerpt, tags, link); card.append(content); grid.append(card);
  }
}

function renderTagFilters() {
  const tags = [...new Set(posts.flatMap(post => post.tags || []))].sort((a, b) => a.localeCompare(b));
  tagBar.replaceChildren();
  for (const [tag, label] of [["all", "All posts"], ...tags.map(tag => [tag, tag])]) {
    const button = document.createElement("button"); button.type = "button"; button.className = `tag-filter${activeTag === tag ? " active" : ""}`; button.dataset.tag = tag; button.textContent = label;
    button.addEventListener("click", () => { activeTag = tag; renderTagFilters(); renderCards(); }); tagBar.append(button);
  }
}

async function renderSinglePost(db, id) {
  grid.hidden = true; document.querySelector(".blog-controls").hidden = true; status.hidden = false; status.textContent = "Loading article…";
  try {
    const snap = await getDoc(doc(db, "posts", id));
    if (!snap.exists() || snap.data().published !== true) throw new Error("This article is unavailable.");
    const post = snap.data(); const header = document.createElement("header"); header.className = "article-header";
    const back = document.createElement("a"); back.className = "article-back"; back.href = "blog.html"; back.textContent = "← All articles";
    const meta = document.createElement("p"); meta.className = "blog-card-meta"; meta.textContent = `${dateLabel(post.publishedAt || post.updatedAt)} · ${post.readingMinutes || 1} min read · ${post.author || "Muhammad Umar"}`;
    const h1 = document.createElement("h1"); h1.textContent = post.title;
    const excerpt = document.createElement("p"); excerpt.className = "article-excerpt"; excerpt.textContent = post.excerpt;
    header.append(back, meta, h1, excerpt); article.replaceChildren(header);
    if (post.coverImage) { const img = document.createElement("img"); img.className = "article-cover"; img.src = post.coverImage; img.alt = ""; article.append(img); }
    const body = document.createElement("div"); body.className = "article-body"; body.innerHTML = safeRichContent(post.content); article.append(body);
    status.hidden = true; article.hidden = false; document.title = `${post.title} — Muhammad Umar`;
  } catch (error) { status.textContent = error.message; status.className = "blog-status error"; }
}

async function start() {
  if (!hasFirebaseConfig()) { status.textContent = "The blog is being connected to Firebase. Please check back soon."; return; }
  try {
    const app = initializeApp(firebaseConfig); const db = getFirestore(app);
    const postId = new URLSearchParams(location.search).get("post");
    if (postId) { await renderSinglePost(db, postId); return; }
    const snapshot = await getDocs(query(collection(db, "posts"), where("published", "==", true), orderBy("publishedAt", "desc")));
    posts = snapshot.docs.map(item => ({ id: item.id, ...item.data() })); renderTagFilters(); renderCards();
  } catch (error) { status.textContent = "Articles could not be loaded. Firebase access or its database setup needs attention."; status.classList.add("error"); console.error(error); }
}

searchInput.addEventListener("input", renderCards);
start();
