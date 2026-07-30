import { supabase } from "./supabase.js";

const signedInPanel = document.getElementById("index-signed-in-panel");
const signedInEmail = document.getElementById("index-signed-in-email");
const signedOutPanel = document.getElementById("index-signed-out-panel");
const logoutBtn = document.getElementById("index-logout-btn");

async function refreshIndexAuthUI() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (user) {
    signedInPanel.style.display = "block";
    signedOutPanel.style.display = "none";
    signedInEmail.textContent = user.email ?? "";
  } else {
    signedInPanel.style.display = "none";
    signedOutPanel.style.display = "block";
    signedInEmail.textContent = "";
  }
}

async function loadAuthors() {
  const container = document.getElementById("dynamic-authors");
  if (!container) return;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("username")
    .order("username", { ascending: true });

  if (error) {
    console.error("Failed to load profiles:", error);
    return;
  }

  container.innerHTML = "";
  for (const profile of profiles) {
    const card = document.createElement("a");
    card.href = `authors/author.html?author=${profile.username}`;
    card.className = "image-card grow";

    const img = document.createElement("img");
    img.src = "img/meerkats.jpg";
    img.alt = `${profile.username}'s page`;

    card.appendChild(img);
    container.appendChild(card);
  }
}

async function initializeIndexAuthUI() {
  await refreshIndexAuthUI();
  await loadAuthors();
  supabase.auth.onAuthStateChange(() => {
    refreshIndexAuthUI();
    loadAuthors();
  });
  window.addEventListener("pageshow", () => {
    refreshIndexAuthUI();
    loadAuthors();
  });
}

initializeIndexAuthUI();

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
});
