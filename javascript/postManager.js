import { supabase, POST_IMAGES_BUCKET } from './supabase.js';

let currentAuthorProfile = null;
let profileEditorInitialized = false;

function setProfileEditorVisible(isVisible) {
  const section = document.getElementById('profile-edit-section');
  if (section) {
    section.style.display = isVisible ? '' : 'none';
  }
}

function populateProfileForm() {
  const usernameInput = document.getElementById('profile-username');
  const bioInput = document.getElementById('profile-bio');
  const statusEl = document.getElementById('profile-status');

  if (usernameInput) usernameInput.value = currentAuthorProfile?.username || '';
  if (bioInput) bioInput.value = currentAuthorProfile?.biography || '';
  if (statusEl) statusEl.textContent = '';
}

function setupProfileEditor() {
  if (profileEditorInitialized) return;

  const editProfileBtn = document.getElementById('edit-profile-btn');
  const cancelBtn = document.getElementById('cancel-profile-btn');
  const form = document.getElementById('profile-edit-form');

  if (!editProfileBtn || !cancelBtn || !form) return;

  editProfileBtn.addEventListener('click', () => {
    if (!currentAuthorProfile) return;
    populateProfileForm();
    setProfileEditorVisible(true);
  });

  cancelBtn.addEventListener('click', () => {
    setProfileEditorVisible(false);
    const statusEl = document.getElementById('profile-status');
    if (statusEl) statusEl.textContent = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const statusEl = document.getElementById('profile-status');
    if (!statusEl || !currentAuthorProfile) return;

    statusEl.style.color = '';
    statusEl.textContent = 'Saving profile...';

    const usernameInput = document.getElementById('profile-username');
    const bioInput = document.getElementById('profile-bio');
    const username = usernameInput?.value.trim().toLowerCase() || '';
    const biography = bioInput?.value.trim() || '';

    if (!username) {
      statusEl.style.color = 'red';
      statusEl.textContent = 'Username is required.';
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username, biography })
      .eq('id', currentAuthorProfile.id);

    if (error) {
      statusEl.style.color = 'red';
      if (error.code === '23505' || (error.message && error.message.includes('unique'))) {
        statusEl.textContent = 'Username is already taken. Please choose another one.';
      } else {
        statusEl.textContent = 'Failed to save profile: ' + error.message;
      }
      return;
    }

    currentAuthorProfile = { ...currentAuthorProfile, username, biography };

    const authorDiv = document.querySelector('author-div');
    if (authorDiv) {
      authorDiv.setAttribute('header', `${username}'s page`);
      authorDiv.setAttribute('content', biography || 'No biography provided.');
    }

    const params = new URLSearchParams(window.location.search);
    params.set('author', username);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

    statusEl.style.color = 'green';
    statusEl.textContent = 'Profile saved successfully!';
    setProfileEditorVisible(false);
    await loadPosts();
  });

  profileEditorInitialized = true;
}

function showPostsMessage(message) {
  const container = document.getElementById('posts');
  if (!container) return;

  container.innerHTML = '';
  const messageEl = document.createElement('div');
  messageEl.className = 'container';
  messageEl.textContent = message;
  container.appendChild(messageEl);
}

async function loadPosts() {
  const container = document.getElementById('posts');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const username = params.get('author');

  if (!username) {
    showPostsMessage('No author specified.');
    const authorDiv = document.querySelector('author-div');
    if (authorDiv) {
      authorDiv.setAttribute('header', 'No Author');
      authorDiv.setAttribute('content', 'Please specify an author in the URL (e.g., ?author=username).');
    }
    return;
  }

  // Fetch author profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('Failed to load profile:', profileError);
    showPostsMessage(`Author "${username}" not found.`);
    const authorDiv = document.querySelector('author-div');
    if (authorDiv) {
      authorDiv.setAttribute('header', 'Author Not Found');
      authorDiv.setAttribute('content', '');
    }
    return;
  }

  currentAuthorProfile = profile;
  setupProfileEditor();

  // Update profile header and bio
  const authorDiv = document.querySelector('author-div');
  if (authorDiv) {
    authorDiv.setAttribute('header', `${profile.username}'s page`);
    authorDiv.setAttribute('content', profile.biography || 'No biography provided.');
    authorDiv.setAttribute('img', 'meerkats.jpg');
  }

  // Check if current user is the owner of this page
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUser = session?.user;
  if (currentUser && currentUser.id === profile.id) {
    const newPostBtn = document.getElementById('new-post-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (newPostBtn) {
      newPostBtn.style.display = '';
      newPostBtn.href = `new-post.html?author=${encodeURIComponent(profile.username)}`;
    }
    if (editProfileBtn) editProfileBtn.style.display = '';
  }

  // Fetch posts for this author
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', profile.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load posts:', error);
    showPostsMessage('Could not load posts.');
    return;
  }

  container.innerHTML = '';
  if (posts.length === 0) {
    showPostsMessage('No posts yet.');
    return;
  }

  for (const post of posts) {
    container.appendChild(renderPost(post));
  }
  applyTopicFilter();
}

function renderPost(post) {
  const wrapper = document.createElement('div');
  wrapper.className = 'container post';
  wrapper.style.backgroundColor = '#f0f0f0';
  wrapper.style.padding = '8px';
  wrapper.dataset.title = post.title ?? '';
  wrapper.dataset.topic = post.topic ?? '';
  wrapper.dataset.subtopic = post.subtopic ?? '';
  wrapper.dataset.date = post.date ?? '';

  const inner = document.createElement('div');
  inner.style.marginLeft = '20px';

  const h2 = document.createElement('h2');
  h2.className = 'underline';
  h2.textContent = post.title ?? '';
  inner.appendChild(h2);

  const metaParts = [];
  if (post.topic) metaParts.push(`Topic: ${post.topic}`);
  if (post.subtopic) metaParts.push(`Subtopic: ${post.subtopic}`);
  if (post.date) metaParts.push(`Date: ${post.date}`);
  if (metaParts.length) {
    const meta = document.createElement('h5');
    meta.textContent = metaParts.join('   |   ');
    inner.appendChild(meta);
  }

  if (post.image_path) {
    const { data } = supabase.storage
      .from(POST_IMAGES_BUCKET)
      .getPublicUrl(post.image_path);
    const imgCard = document.createElement('div');
    imgCard.className = 'image-card';
    imgCard.style.marginBottom = '15px';
    const img = document.createElement('img');
    img.src = data.publicUrl;
    img.alt = post.title ?? 'Post image';
    imgCard.appendChild(img);
    inner.appendChild(imgCard);
  }

  if (post.body) {
    const p = document.createElement('p');
    p.style.whiteSpace = 'pre-wrap';
    p.textContent = post.body;
    inner.appendChild(p);
  }

  wrapper.appendChild(inner);
  return wrapper;
}

function applyTopicFilter() {
  const filter = document.getElementById('topic-filter');
  if (!filter) return;
  const topic = filter.value;
  document.querySelectorAll('.post').forEach(post => {
    post.style.display =
      topic === 'all' || post.dataset.topic === topic ? '' : 'none';
  });
}

loadPosts();

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'topic-filter') {
    applyTopicFilter();
  }
});
