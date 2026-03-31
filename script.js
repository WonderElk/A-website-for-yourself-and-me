
/* CLASSES */
// Author header
class AuthorDiv extends HTMLElement{
  connectedCallback() {
    // Input
    const img = this.getAttribute("img");
    const header = this.getAttribute("header").replace("\n", "<br>");
    const content = this.getAttribute("content"); 

    // HTML
    this.innerHTML = `
    <div class="container">
      <div class="flex-container">
        <a href="../index.html" class="image-card">
          <img src="../img/${img}" alt="Author image">
        </a>
        <div class="intro">
          <h2 class="underline">${header}</h2>
          <p>${content}</p>
        </div>
      </div>

      <div class = "dropdown" style="margin-top:15px;">
        <select id="topic-filter">
          <option value="all">Topic</option>
          <option value="motion">Motion</option>
          <option value="webdev">WebDev</option>
        </select>
      </div>
    </div>
    `;
  }
} 
customElements.define("author-div", AuthorDiv);
