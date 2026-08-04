import { supabase, POST_IMAGES_BUCKET } from "./supabase.js";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  
  if (user) {
    // Check if user has a profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

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
  supabase.auth.onAuthStateChange((_event, _session) => {
    refreshAuthUI();
  });
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

// Profile Form Listeners
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  profileStatus.style.color = "";
  profileStatus.textContent = "Saving profile...";

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
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
    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "bin";
    const path = `avatars/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) {
      profileStatus.style.color = "red";
      profileStatus.textContent = "Image upload failed: " + uploadError.message;
      return;
    }
    avatarPath = path;
  }

  let error = null;
  if (userProfile) {
    // Update
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username, biography, avatar_path: avatarPath })
      .eq("id", user.id);
    error = updateError;
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, username, biography, avatar_path: avatarPath });
    error = insertError;
  }

  if (error) {
    profileStatus.style.color = "red";
    if (error.code === "23505" || (error.message && error.message.includes("unique"))) {
      profileStatus.textContent = "Username is already taken. Please choose another one.";
    } else {
      profileStatus.textContent = "Failed to save profile: " + error.message;
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      postStatus.style.color = "red";
      postStatus.textContent = "You are not logged in.";
      return;
    }

    let imagePath = null;
    const file = postForm.image.files[0];
    if (file) {
      const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : "bin";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(POST_IMAGES_BUCKET)
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) {
        postStatus.style.color = "red";
        postStatus.textContent = "Image upload failed: " + uploadError.message;
        return;
      }
      imagePath = path;
    }

    const postData = {
      title: postForm.title.value.trim(),
      topic: postForm.topic.value || null,
      subtopic: postForm.subtopic.value.trim() || null,
      date: new Date().toISOString().split("T")[0],
      body: postForm.body.value || null,
      image_path: imagePath,
      author_id: user.id,
    };

    const { error: insertError } = await supabase.from("posts").insert(postData);

    if (insertError) {
      postStatus.style.color = "red";
      postStatus.textContent = "Failed to save post: " + insertError.message;
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
