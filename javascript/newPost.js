import { supabase, POST_IMAGES_BUCKET } from './supabase.js';

const loginSection = document.getElementById('login-section');
const postSection = document.getElementById('post-section');
const userEmailEl = document.getElementById('user-email');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const postForm = document.getElementById('post-form');
const postStatus = document.getElementById('post-status');
const dateInput = postForm.querySelector('input[name="date"]');

const today = new Date().toISOString().slice(0, 10);
dateInput.value = today;

async function refreshAuthUI() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (user) {
    loginSection.style.display = 'none';
    postSection.style.display = '';
    userEmailEl.textContent = user.email ?? '';
  } else {
    loginSection.style.display = '';
    postSection.style.display = 'none';
    userEmailEl.textContent = '';
  }
}

refreshAuthUI();
supabase.auth.onAuthStateChange(() => refreshAuthUI());

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) loginError.textContent = error.message;
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  postStatus.style.color = '';
  postStatus.textContent = 'Creating post...';

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    postStatus.style.color = 'red';
    postStatus.textContent = 'You are not logged in.';
    return;
  }

  let imagePath = null;
  const file = postForm.image.files[0];
  if (file) {
    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) {
      postStatus.style.color = 'red';
      postStatus.textContent = 'Image upload failed: ' + uploadError.message;
      return;
    }
    imagePath = path;
  }

  const { error: insertError } = await supabase.from('posts').insert({
    title: postForm.title.value.trim(),
    topic: postForm.topic.value || null,
    subtopic: postForm.subtopic.value.trim() || null,
    date: postForm.date.value,
    body: postForm.body.value || null,
    image_path: imagePath,
    author_id: user.id,
  });

  if (insertError) {
    postStatus.style.color = 'red';
    postStatus.textContent = 'Failed to save post: ' + insertError.message;
    return;
  }

  postStatus.style.color = 'green';
  postStatus.textContent = 'Post created.';
  postForm.reset();
  dateInput.value = today;
});
