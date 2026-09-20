import {
  authenticatedFetch,
  getCurrentUser,
  signIn,
  signOut,
  uploadImage,
} from "./backendAuth.js";

const loginSection = document.getElementById("login-section");
const postSection = document.getElementById("post-section");
const userEmailEl = document.getElementById("user-email");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const postForm = document.getElementById("post-form");
const postStatus = document.getElementById("post-status");

// Profile elements
const profileSection = document.getElementById("profile-section");
const profileForm = document.getElementById("profile-form");
const profileHeading = document.getElementById("profile-heading");
const profileIntroText = document.getElementById("profile-intro-text");
const profileSubmitBtn = document.getElementById("profile-submit-btn");
const cancelProfileBtn = document.getElementById("cancel-profile-btn");
const profileStatus = document.getElementById("profile-status");
const myPageLink = document.getElementById("my-page-link");
const backLink = document.getElementById("back-link");

let userProfile = null;

function updateBackLink(targetUsername) {
  if (!backLink) return;

  const params = new URLSearchParams(window.location.search);
  const authorFromQuery = params.get("author")?.trim();
  const resolvedUsername = authorFromQuery || targetUsername || "";

  if (resolvedUsername) {
    backLink.href = `author.html?author=${encodeURIComponent(resolvedUsername)}`;
    backLink.textContent = "← Back to profile";
  } else {
    backLink.href = "../index.html";
    backLink.textContent = "← Back to posts";
  }
}

async function refreshAuthUI() {
  const user = await getCurrentUser();
  
  if (user) {
    const profileResponse = await authenticatedFetch("/profiles/me");
    const profile = profileResponse.ok ? await profileResponse.json() : null;

    if (profile) {
      userProfile = profile;
      loginSection.style.display = "none";
      profileSection.style.display = "none";
      postSection.style.display = "";
      userEmailEl.textContent = user.email ?? "";
      myPageLink.href = `author.html?author=${profile.username}`;
      updateBackLink(profile.username);
    } else {
      userProfile = null;
      loginSection.style.display = "none";
      profileSection.style.display = "";
      postSection.style.display = "none";
      userEmailEl.textContent = "";

      profileHeading.textContent = "Create your profile";
      profileIntroText.textContent = "Before you can post, you must create an author profile.";
      profileSubmitBtn.textContent = "Create profile";
      cancelProfileBtn.style.display = "none";
      profileForm.reset();
      updateBackLink(null);
    }
  } else {
    userProfile = null;
    loginSection.style.display = "";
    profileSection.style.display = "none";
    postSection.style.display = "none";
    userEmailEl.textContent = "";
    updateBackLink(null);
  }
}

async function initializeAuthUI() {
  await refreshAuthUI();
  window.addEventListener("pageshow", () => {
    refreshAuthUI();
  });
}

initializeAuthUI();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  try {
    await signIn(email, password);
    await refreshAuthUI();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  signOut();
  await refreshAuthUI();
});

// Profile Form Listeners
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  profileStatus.style.color = "";
  profileStatus.textContent = "Saving profile...";

  const user = await getCurrentUser();
  if (!user) {
    profileStatus.style.color = "red";
    profileStatus.textContent = "You are not logged in.";
    return;
  }

  const username = profileForm.username.value.trim().toLowerCase();
  const biography = profileForm.bio.value.trim();

  let avatarPath = userProfile?.avatar_path || null;
  const file = profileForm.image?.files?.[0];
  if (file) {
    try {
      avatarPath = await uploadImage(file, "avatars");
    } catch (error) {
      profileStatus.style.color = "red";
      profileStatus.textContent = "Image upload failed: " + error.message;
      return;
    }
  }

  const profileResponse = await authenticatedFetch(
    userProfile ? "/profiles/me" : "/profiles/me",
    {
      method: userProfile ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, biography, avatar_path: avatarPath }),
    },
  );

  if (!profileResponse.ok) {
    const errorData = await profileResponse.json().catch(() => ({}));
    profileStatus.style.color = "red";
    if (profileResponse.status === 409) {
      profileStatus.textContent = "Username is already taken. Please choose another one.";
    } else {
      profileStatus.textContent = "Failed to save profile: " + (errorData.detail || "Unknown error");
    }
    return;
  }

  profileStatus.style.color = "green";
  profileStatus.textContent = "Profile saved successfully!";
  
  await refreshAuthUI();
});

cancelProfileBtn.addEventListener("click", () => {
  profileSection.style.display = "none";
  postSection.style.display = "";
});

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  postStatus.style.color = "";
  postStatus.textContent = "Creating post...";

  try {
    const user = await getCurrentUser();
    if (!user) {
      postStatus.style.color = "red";
      postStatus.textContent = "You are not logged in.";
      return;
    }

    let imagePath = null;
    const file = postForm.image.files[0];
    if (file) {
      try {
        imagePath = await uploadImage(file, "posts");
      } catch (error) {
        postStatus.style.color = "red";
        postStatus.textContent = "Image upload failed: " + error.message;
        return;
      }
    }

    const postData = {
      title: postForm.title.value.trim(),
      topic: postForm.topic.value || null,
      subtopic: postForm.subtopic.value.trim() || null,
      date: new Date().toISOString().split("T")[0],
      body: postForm.body.value || null,
      image_path: imagePath,
    };

    const response = await authenticatedFetch("/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      postStatus.style.color = "red";
      postStatus.textContent = "Failed to save post: " + (errorData.detail || "Unknown error");
      return;
    }

    postStatus.style.color = "green";
    postStatus.textContent = "Post created.";
    postForm.reset();
  } catch (err) {
    console.error("Error creating post:", err);
    postStatus.style.color = "red";
    postStatus.textContent = "Error creating post: " + (err.message || err);
  }
});
