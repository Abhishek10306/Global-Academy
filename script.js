if (!localStorage.getItem("loggedIn")) {
  window.location.href = "login.html";
}

let videos = [];
const grid = document.getElementById("videoGrid");
const searchInput = document.getElementById("searchInput");
const searchInfo = document.getElementById("searchInfo");

fetch("videos.json")
  .then(res => res.json())
  .then(data => {
    videos = data;
    displayVideos(videos);
  });

function displayVideos(list, searchTerm = "") {
  grid.innerHTML = "";

  list.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";

    let title = video.title;

    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, "gi");
      title = video.title.replace(regex, `<span class="highlight">$1</span>`);
    }

    card.innerHTML = `<div class="video-title">${title}</div>`;

    card.onclick = () => {
      document.querySelectorAll(".video-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      openPlayer(video.driveId);
    };

    grid.appendChild(card);
  });
}

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase().trim();

  if (!value) {
    searchInfo.textContent = "";
    displayVideos(videos);
    return;
  }

  const matched = [];
  const others = [];

  videos.forEach(video => {
    if (video.title.toLowerCase().includes(value)) {
      matched.push(video);
    } else {
      others.push(video);
    }
  });

  displayVideos([...matched, ...others], value);
  searchInfo.textContent = `${matched.length} result(s) found`;
});

function openPlayer(id) {
  document.getElementById("videoPlayer").innerHTML =
    `<iframe src="https://drive.google.com/file/d/${id}/preview" allow="autoplay"></iframe>`;
  document.getElementById("playerModal").classList.remove("hidden");
}

function closePlayer() {
  document.getElementById("playerModal").classList.add("hidden");
  document.getElementById("videoPlayer").innerHTML = "";
}

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");
}