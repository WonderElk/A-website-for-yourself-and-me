import { assetUrl, authenticatedFetch, getCurrentUser, signOut } from "./backendAuth.js";

const signedInPanel = document.getElementById("index-signed-in-panel");
const signedInEmail = document.getElementById("index-signed-in-email");
const signedOutPanel = document.getElementById("index-signed-out-panel");
const logoutBtn = document.getElementById("index-logout-btn");

async function refreshIndexAuthUI() {
  const user = await getCurrentUser();

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

  const response = await authenticatedFetch("/profiles");
  if (!response.ok) {
    console.error("Failed to load profiles:", response.status);
    return;
  }
  const profiles = await response.json();

  container.innerHTML = "";
  for (const profile of profiles) {
    const card = document.createElement("a");
    card.href = `authors/author.html?author=${profile.username}`;
    card.className = "image-card grow";

    let avatarSrc = "img/meerkats.jpg";
    if (profile.avatar_path) {
      avatarSrc = assetUrl(profile.avatar_path);
    }

    const img = document.createElement("img");
    img.src = avatarSrc;
    img.alt = `${profile.username}'s page`;

    card.appendChild(img);
    container.appendChild(card);
  }
}

async function initializeIndexAuthUI() {
  await refreshIndexAuthUI();
  await loadAuthors();
  window.addEventListener("pageshow", () => {
    refreshIndexAuthUI();
    loadAuthors();
  });
}

initializeIndexAuthUI();

logoutBtn.addEventListener("click", async () => {
  signOut();
  await refreshIndexAuthUI();
});
