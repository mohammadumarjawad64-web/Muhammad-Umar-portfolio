import { firebaseConfig, adminEmail, hasFirebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const setupNote = document.querySelector("#firebase-setup-note");
const loginPanel = document.querySelector("#login-panel");
const studioPanel = document.querySelector("#studio-panel");
const loginMessage = document.querySelector("#login-message");
const saveMessage = document.querySelector("#save-message");
const form = document.querySelector("#post-form");
const contentEditor = document.querySelector("#post-content");
const coverInput = document.querySelector("#post-cover");
const coverPreview = document.querySelector("#cover-preview");
let auth;
let db;

function message(element, text, kind = "") { element.textContent = text; element.className = `form-message${kind ? ` ${kind}` : ""}`; }
function slugify(value) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "article"; }
function readingMinutes(html) { const text = new DOMParser().parseFromString(html, "text/html").body.innerText.replace(/\[YouTube video:[^\]]+\]/g, ""); return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 220)); }
function dateText(value) { const date = value?.toDate ? value.toDate() : null; return date ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date) : "Draft"; }

if (!hasFirebaseConfig()) {
  setupNote.hidden = false;
} else {
  const app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app);
  if (isSignInWithEmailLink(auth, window.location.href)) {
    const storedEmail = window.sessionStorage.getItem("blogAdminEmail");
    const email = storedEmail || window.prompt("Confirm your admin email to finish signing in:");
    if (email) {
      try {
        await signInWithEmailLink(auth, email.trim(), window.location.href);
        window.sessionStorage.removeItem("blogAdminEmail");
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) { message(loginMessage, "This sign-in link is invalid or has expired. Request a new one.", "error"); }
    }
  }
  onAuthStateChanged(auth, async user => {
    const allowed = user && user.email?.toLowerCase() === adminEmail.toLowerCase() && user.emailVerified;
    loginPanel.hidden = Boolean(allowed); studioPanel.hidden = !allowed;
    if (user && !allowed) { await signOut(auth); message(loginMessage, "This account is not the verified blog administrator.", "error"); return; }
    if (allowed) await refreshPostList();
  });
}

document.querySelector("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!auth) return;
  const email = document.querySelector("#login-email").value.trim().toLowerCase();
  if (email.toLowerCase() !== adminEmail.toLowerCase()) { message(loginMessage, "Only the configured admin account can sign in here.", "error"); return; }
  const actionCodeSettings = { url: `${window.location.origin}${window.location.pathname}`, handleCodeInApp: true };
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.sessionStorage.setItem("blogAdminEmail", email);
    message(loginMessage, "Check your inbox for a secure sign-in link.", "success");
  } catch (error) { console.error(error); message(loginMessage, "Could not send the link. Check Firebase authorized domains and email-link sign-in settings.", "error"); }
});

document.querySelector("#logout-button").addEventListener("click", () => signOut(auth));
document.querySelector("#new-post").addEventListener("click", clearForm);
coverInput.addEventListener("input", () => { const url = coverInput.value.trim(); if (url) { coverPreview.src = url; coverPreview.hidden = false; } else coverPreview.hidden = true; });

document.querySelectorAll(".editor-toolbar [data-command]").forEach(button => button.addEventListener("click", () => {
  contentEditor.focus(); document.execCommand(button.dataset.command, false, button.dataset.value || null);
}));
document.querySelector("#insert-link").addEventListener("click", () => {
  const value = prompt("Paste a link (https://…)"); if (!value) return;
  try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); contentEditor.focus(); document.execCommand("createLink", false, url.href); }
  catch { message(saveMessage, "Enter a valid http or https link.", "error"); }
});
document.querySelector("#insert-youtube").addEventListener("click", () => {
  const value = prompt("Paste a YouTube video URL"); if (!value) return;
  let id = "";
  try { const url = new URL(value); if (url.hostname === "youtu.be") id = url.pathname.slice(1); else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) id = url.searchParams.get("v") || url.pathname.match(/\/embed\/([\w-]{11})/)?.[1] || ""; } catch { }
  if (!/^[\w-]{11}$/.test(id)) { message(saveMessage, "That does not look like a valid YouTube video link.", "error"); return; }
  const placeholder = document.createElement("div"); placeholder.className = "youtube-placeholder"; placeholder.contentEditable = "false"; placeholder.dataset.youtubeId = id; placeholder.textContent = `YouTube video ready to embed · ${id}`;
  contentEditor.focus(); const selection = getSelection(); if (selection?.rangeCount && contentEditor.contains(selection.anchorNode)) selection.getRangeAt(0).insertNode(placeholder); else contentEditor.append(placeholder); contentEditor.append(document.createElement("p"));
});

function clearForm() {
  form.reset(); document.querySelector("#post-id").value = ""; contentEditor.innerHTML = ""; coverPreview.hidden = true; coverPreview.removeAttribute("src"); message(saveMessage, "");
  document.querySelector("#post-title").focus();
}

function normalizedContent() {
  const copy = contentEditor.cloneNode(true);
  copy.querySelectorAll(".youtube-placeholder[data-youtube-id]").forEach(item => {
    const id = item.dataset.youtubeId;
    if (!/^[\w-]{11}$/.test(id)) { item.remove(); return; }
    const marker = document.createElement("div"); marker.dataset.youtubeId = id; marker.textContent = `[YouTube video: ${id}]`; item.replaceWith(marker);
  });
  copy.querySelectorAll("script,style,iframe,object,embed").forEach(node => node.remove());
  copy.querySelectorAll("*").forEach(node => [...node.attributes].forEach(attr => { if (!attr.name.startsWith("data-") && !["href", "target", "rel"].includes(attr.name)) node.removeAttribute(attr.name); }));
  copy.querySelectorAll("a").forEach(link => { try { const url = new URL(link.getAttribute("href"), location.href); if (!["http:", "https:"].includes(url.protocol)) link.removeAttribute("href"); else { link.href = url.href; link.target = "_blank"; link.rel = "noopener noreferrer"; } } catch { link.removeAttribute("href"); } });
  return copy.innerHTML.trim();
}

form.addEventListener("submit", async event => {
  event.preventDefault(); if (!auth?.currentUser) return;
  const title = document.querySelector("#post-title").value.trim();
  const excerpt = document.querySelector("#post-excerpt").value.trim();
  const content = normalizedContent();
  const tags = [...new Set(document.querySelector("#post-tags").value.split(",").map(tag => tag.trim()).filter(Boolean))].slice(0, 8);
  const published = document.querySelector("#post-published").checked;
  const coverImage = coverInput.value.trim();
  if (!title || !excerpt || !content) { message(saveMessage, "Add a title, summary, and article body first.", "error"); return; }
  if (coverImage) { try { if (!["http:", "https:"].includes(new URL(coverImage).protocol)) throw new Error(); } catch { message(saveMessage, "Cover image must be a valid http or https URL.", "error"); return; } }
  const postId = document.querySelector("#post-id").value;
  message(saveMessage, "Saving…");
  try {
    const prior = postId ? (await getDoc(doc(db, "posts", postId))).data() : null;
    const post = { title, slug: slugify(title), excerpt, content, coverImage, tags, author: "Muhammad Umar", published, updatedAt: serverTimestamp(), readingMinutes: readingMinutes(content) };
    post.createdAt = prior?.createdAt || serverTimestamp();
    if (published) post.publishedAt = prior?.publishedAt || serverTimestamp(); else if (prior?.publishedAt) post.publishedAt = prior.publishedAt;
    if (postId) await setDoc(doc(db, "posts", postId), post); else await addDoc(collection(db, "posts"), post);
    message(saveMessage, published ? "Article published." : "Draft saved.", "success"); clearForm(); await refreshPostList();
  } catch (error) { console.error(error); message(saveMessage, "Could not save. Check the Firestore rules and connection.", "error"); }
});

async function refreshPostList() {
  if (!db || !auth?.currentUser) return;
  const list = document.querySelector("#admin-post-list"); list.innerHTML = "";
  try {
    const snapshots = await getDocs(query(collection(db, "posts"), orderBy("updatedAt", "desc")));
    document.querySelector("#post-count").textContent = snapshots.size;
    if (snapshots.empty) { list.innerHTML = '<p class="muted">No saved posts yet. Start with a new article.</p>'; return; }
    snapshots.forEach(snapshot => {
      const data = snapshot.data(); const row = document.createElement("div"); row.className = "admin-post-item";
      const title = document.createElement("div"); const strong = document.createElement("strong"); strong.textContent = data.title; const small = document.createElement("small"); small.textContent = `${data.published ? "Published" : "Draft"} · ${dateText(data.updatedAt)}`; title.append(strong, small);
      const actions = document.createElement("div"); actions.className = "admin-post-actions";
      const edit = document.createElement("button"); edit.type = "button"; edit.title = "Edit article"; edit.innerHTML = '<i class="fa-solid fa-pen"></i>'; edit.addEventListener("click", () => loadPost(snapshot.id));
      const remove = document.createElement("button"); remove.type = "button"; remove.title = "Delete article"; remove.className = "delete"; remove.innerHTML = '<i class="fa-solid fa-trash"></i>'; remove.addEventListener("click", async () => { if (!confirm(`Delete “${data.title}”?`)) return; await deleteDoc(doc(db, "posts", snapshot.id)); await refreshPostList(); });
      actions.append(edit, remove); row.append(title, actions); list.append(row);
    });
  } catch (error) { console.error(error); list.innerHTML = '<p class="muted">Could not load saved posts. Confirm the admin Firestore rules are deployed.</p>'; }
}

async function loadPost(id) {
  const snapshot = await getDoc(doc(db, "posts", id)); if (!snapshot.exists()) return;
  const post = snapshot.data(); document.querySelector("#post-id").value = id; document.querySelector("#post-title").value = post.title || "";
  document.querySelector("#post-excerpt").value = post.excerpt || ""; document.querySelector("#post-tags").value = (post.tags || []).join(", ");
  document.querySelector("#post-published").checked = Boolean(post.published);
  contentEditor.innerHTML = (post.content || "").replace(/<div data-youtube-id="([\w-]{11})">\[YouTube video: [\w-]{11}\]<\/div>/g, '<div class="youtube-placeholder" contenteditable="false" data-youtube-id="$1">YouTube video ready to embed · $1</div>');
  coverInput.value = post.coverImage || ""; if (post.coverImage) { coverPreview.src = post.coverImage; coverPreview.hidden = false; } else coverPreview.hidden = true;
  document.querySelector("#post-title").focus(); window.scrollTo({ top: 0, behavior: "smooth" });
}
