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
  if (!container) return [];

  const response = await authenticatedFetch("/profiles");
  if (!response.ok) {
    console.error("Failed to load profiles:", response.status);
    return [];
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
  return profiles;
}

async function loadPosts(profiles) {
  const container = document.getElementById("posts");
  if (!container) return;

  const response = await authenticatedFetch("/posts");
  if (!response.ok) {
    console.error("Failed to load posts:", response.status);
    container.textContent = "Could not load posts.";
    return;
  }

  const posts = await response.json();
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  container.innerHTML = "";

  if (posts.length === 0) {
    container.textContent = "No posts yet.";
    return;
  }

  for (const post of posts) {
    const wrapper = document.createElement("article");
    wrapper.className = "recent-post-card";

    const title = document.createElement("h2");
    title.className = "underline";
    title.textContent = post.title;
    wrapper.appendChild(title);

    const profile = profilesById.get(post.author_id);
    const author = document.createElement(profile ? "a" : "p");
    if (profile) {
      author.href = `authors/author.html?author=${encodeURIComponent(profile.username)}`;
      author.textContent = `By ${profile.username}`;
    } else {
      author.textContent = "By unknown author";
    }
    wrapper.appendChild(author);

    const details = [post.topic, post.subtopic, post.date].filter(Boolean);
    if (details.length) {
      const meta = document.createElement("p");
      meta.textContent = details.join(" | ");
      wrapper.appendChild(meta);
    }

    if (post.image_path) {
      const imageCard = document.createElement("div");
      imageCard.className = "image-card";
      const image = document.createElement("img");
      image.src = assetUrl(post.image_path);
      image.alt = post.title || "Post image";
      imageCard.appendChild(image);
      wrapper.appendChild(imageCard);
    }

    if (post.body) {
      const body = document.createElement("p");
      body.style.whiteSpace = "pre-wrap";
      body.textContent = post.body;
      wrapper.appendChild(body);
    }

    container.appendChild(wrapper);
  }
}

async function initializeIndexAuthUI() {
  await refreshIndexAuthUI();
  const profiles = await loadAuthors();
  await loadPosts(profiles);
  window.addEventListener("pageshow", () => {
    refreshIndexAuthUI();
    loadAuthors().then(loadPosts);
  });
}

initializeIndexAuthUI();

logoutBtn.addEventListener("click", async () => {
  signOut();
  await refreshIndexAuthUI();
});
