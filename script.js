// Author header
class AuthorDiv extends HTMLElement{
  connectedCallback() {
    const img = this.getAttribute("img");
    const header = this.getAttribute("header").replace("\n", "<br>");
    const content = this.getAttribute("content"); 

    this.innerHTML = `
    <div class="container padding">
      <div class="image-card">
        <img src="../img/${img}" alt="Author image">
      </div>
      <div class="intro">
        <h1 class="underline">${header}</h1>
        <p>${content}</p>
      </div>
      <!-- Tabs Container -->
      <div class="tabs-container">
        <!-- Topic Selector -->
        <div class="tab">
          <label for="topic">Topic:</label>
          <select id="topic">
            <option value="">--Select Topic--</option>
            <option value="robotics">Robotics</option>
            <option value="drawing">Drawing</option>
          </select>
        </div>

        <!-- Sub-topic Selector -->
        <div class="tab">
          <label for="subtopic">Sub-topic:</label>
          <select id="subtopic">
            <option value="">--Select Sub-topic--</option>
          </select>
        </div>
      <div>
    </div>
    `;
  }
}
customElements.define("author-div", AuthorDiv);

/* TEMPORARY (ChatGPT vibe coding danger danger)*/
const topicSelect = document.getElementById('topic');
  const subtopicSelect = document.getElementById('subtopic');

  const subtopics = {
    robotics: ["Basics of Robotics", "Robot Kinematics", "Control Systems"],
    drawing: ["Shading 101", "Perspective Drawing", "Color Theory"]
  };

  topicSelect.addEventListener('change', () => {
    const topic = topicSelect.value;
    subtopicSelect.innerHTML = '<option value="">--Select Sub-topic--</option>'; // reset
    if (topic && subtopics[topic]) {
      subtopics[topic].forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.toLowerCase().replace(/\s+/g, '-');
        opt.textContent = st;
        subtopicSelect.appendChild(opt);
      });
    }
  });