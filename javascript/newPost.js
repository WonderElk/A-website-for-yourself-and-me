import { supabase, POST_IMAGES_BUCKET } from "./supabase.js";

const signedOutWarning = document.getElementById("signed-out-warning");
const postSection = document.getElementById("post-section");
const userEmailEl = document.getElementById("user-email");
const postForm = document.getElementById("post-form");
const postStatus = document.getElementById("post-status");

async function refreshAuthUI() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (user) {
    signedOutWarning.style.display = "none";
    postSection.style.display = "";
    userEmailEl.textContent = user.email ?? "";
  } else {
    signedOutWarning.style.display = "";
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
