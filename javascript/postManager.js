import { supabase, POST_IMAGES_BUCKET } from './supabase.js';

async function loadPosts() {
  const container = document.getElementById('posts');
  if (!container) return;

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load posts:', error);
    container.textContent = 'Could not load posts.';
    return;
  }

  container.innerHTML = '';
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

document.getElementById('topic-filter')?.addEventListener('change', applyTopicFilter);
