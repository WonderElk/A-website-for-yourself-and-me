// Attributes
//const subtopic = post.subtopic ?? "General"; //Set default value

/*
Add event listener that looks at changes made to topic filter
  to display only the posts included in topic.
  Note: As long as it's called outside a function, 
  it will be called whenever you import from postManager
*/
document.addEventListener("change", e => {
  if (e.target.id !== "topic-filter") return;

  const topic = e.target.value;
  document.querySelectorAll(".post").forEach(post => {
    if (topic === "all" || post.dataset.topic === topic)
      post.style.display = "";
    else
      post.style.display = "none";
  });
});

// Functions
export async function loadPosts(author=null, limit=null){
  const allPosts = await fetch("posts.json").then(r => r.json());
  // if author exists, then set posts to authors posts, and if not, set it to all posts
  let posts = author ? allPosts.filter(post => post.author === author) : allPosts; 
  
  posts.sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );
  posts = limit ? posts.slice(0, limit) : posts;

  const container = document.getElementById("posts")
  for (const post of posts) {
    const html = await fetch(post.path).then(r => r.text());
    //console.log("html response:", html);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    container.appendChild(wrapper.firstElementChild);
  }
}

// async function loadPosts() {
//   const posts = await fetch("posts/index.json").then(r => r.json())
//   for (const post of posts) {
//     const html = await fetch(`posts/${post}`).then(r => r.text());
//     const wrapper = document.createElement("div");
//     wrapper.innerHTML = html;

//     document.getElementById("posts").appendChild(wrapper.firstElementChild);
//   }
// }
// loadPosts(); /* Calls the function we just defined */

