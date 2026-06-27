
/* CLASSES */
// Author header
class AuthorDiv extends HTMLElement {
  static get observedAttributes() {
    return ["img", "header", "content"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const img = this.getAttribute("img") || "meerkats.jpg";
    const header = (this.getAttribute("header") || "Author's page").replace(/\n/g, "<br>");
    const content = this.getAttribute("content") || "";

    this.innerHTML = `
    <div class="container">
      <div class="flex-container">
        <a href="../index.html" class="image-card">
          <img src="../img/${img}" alt="Author image">
        </a>
        <div class="intro">
          <h2 class="underline">${header}</h2>
          <p style="white-space: pre-wrap;">${content}</p>
        </div>
      </div>

      <div class="dropdown" style="margin-top:15px;">
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
