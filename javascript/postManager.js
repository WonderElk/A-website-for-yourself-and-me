import { supabase, POST_IMAGES_BUCKET } from './supabase.js';

let currentAuthorProfile = null;

async function loadPosts() {
  const container = document.getElementById('posts');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const username = params.get('author');

  if (!username) {
    container.textContent = 'No author specified.';
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
    container.textContent = `Author "${username}" not found.`;
    const authorDiv = document.querySelector('author-div');
    if (authorDiv) {
      authorDiv.setAttribute('header', 'Author Not Found');
      authorDiv.setAttribute('content', '');
    }
    return;
  }

  currentAuthorProfile = profile;

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
    if (newPostBtn) newPostBtn.style.display = '';
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
    container.textContent = 'Could not load posts.';
    return;
  }

  container.innerHTML = '';
  if (posts.length === 0) {
    container.textContent = 'No posts yet.';
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
