
async function loadPosts() {
  const posts = await fetch("posts/index.json").then(r => r.json())
  for (const post of posts) {
    const html = await fetch(`posts/${post}`).then(r => r.text());
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    document.getElementById("posts").appendChild(wrapper.firstElementChild);
  }
}

loadPosts(); /* Calls the function we just defined */


/*
Add event listener that looks at changes made to topic filter
  to display only the posts included in topic
*/
document
  .getElementById("topic-filter")
  .addEventListener("change", e => {
    const topic = e.target.value;
    // Display all and only the posts included in topic
    document.querySelectorAll(".post").forEach(post => {
      if(topic === "all" || post.dataset.topic === topic)
        post.style.display = "";
      else
        post.style.display = "none";
    });
});
