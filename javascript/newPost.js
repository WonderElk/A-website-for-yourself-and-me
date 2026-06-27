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
const editProfileBtn = document.getElementById("edit-profile-btn");

let userProfile = null;

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
    }
  } else {
    userProfile = null;
    loginSection.style.display = "";
    profileSection.style.display = "none";
    postSection.style.display = "none";
    userEmailEl.textContent = "";
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

  let error = null;
  if (userProfile) {
    // Update
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username, biography })
      .eq("id", user.id);
    error = updateError;
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, username, biography });
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

editProfileBtn.addEventListener("click", () => {
  if (!userProfile) return;
  profileForm.username.value = userProfile.username;
  profileForm.bio.value = userProfile.biography || "";
  
  profileHeading.textContent = "Edit profile";
  profileIntroText.textContent = "Modify your username or biography below.";
  profileSubmitBtn.textContent = "Save changes";
  cancelProfileBtn.style.display = "";
  profileStatus.textContent = "";

  profileSection.style.display = "";
  postSection.style.display = "none";
});

cancelProfileBtn.addEventListener("click", () => {
  profileSection.style.display = "none";
  postSection.style.display = "";
});

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  postStatus.style.color = "";
  postStatus.textContent = "Creating post...";

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

  const { error: insertError } = await supabase.from("posts").insert({
    title: postForm.title.value.trim(),
    topic: postForm.topic.value || null,
    subtopic: postForm.subtopic.value.trim() || null,
    date: postForm.date.value,
    body: postForm.body.value || null,
    image_path: imagePath,
    author_id: user.id,
  });

  if (insertError) {
    postStatus.style.color = "red";
    postStatus.textContent = "Failed to save post: " + insertError.message;
    return;
  }

  postStatus.style.color = "green";
  postStatus.textContent = "Post created.";
  postForm.reset();
});
