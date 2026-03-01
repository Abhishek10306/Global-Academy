if (!localStorage.getItem("loggedIn")) {
  window.location.href = "login.html";
}

let videos = [];
let autoFullscreenTimer = null;
let currentCastVideoUrl = null; // Used when casting to Chromecast
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
  if (autoFullscreenTimer) {
    clearTimeout(autoFullscreenTimer);
    autoFullscreenTimer = null;
  }
  // Use both autoplay=1 and embedded=true for better TV/browser support
  const embedUrl = `https://drive.google.com/file/d/${id}/preview?autoplay=1&embedded=true`;
  currentCastVideoUrl = embedUrl; // So Cast can send this to the TV
  document.getElementById("videoPlayer").innerHTML =
    `<iframe src="${embedUrl}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  document.getElementById("playerModal").classList.remove("hidden");

  // Auto fullscreen after 15 seconds
  autoFullscreenTimer = setTimeout(() => {
    autoFullscreenTimer = null;
    const modalBox = document.getElementById("modalBox");
    if (modalBox && !document.fullscreenElement && !document.getElementById("playerModal").classList.contains("hidden")) {
      modalBox.requestFullscreen().catch(() => {});
    }
  }, 15000);
}

function closePlayer() {
  currentCastVideoUrl = null;
  if (autoFullscreenTimer) {
    clearTimeout(autoFullscreenTimer);
    autoFullscreenTimer = null;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  document.getElementById("playerModal").classList.add("hidden");
  document.getElementById("videoPlayer").innerHTML = "";
}

function toggleFullscreen() {
  const modalBox = document.getElementById("modalBox");
  if (!modalBox) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    modalBox.requestFullscreen().catch(() => {});
  }
}

document.addEventListener("fullscreenchange", () => {
  const modalBox = document.getElementById("modalBox");
  if (modalBox) {
    modalBox.classList.toggle("is-fullscreen", !!document.fullscreenElement);
  }
});

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");
}

// ——— Cast to TV / wireless device ———
// Google Cast (Chromecast and Cast-enabled devices)
window["__onGCastApiAvailable"] = function (isAvailable) {
  if (isAvailable) initializeCastApi();
};
(function () {
  var s = document.createElement("script");
  s.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
  s.async = true;
  document.head.appendChild(s);
})();

function initializeCastApi() {
  try {
    var ctx = cast.framework.CastContext.getInstance();
    ctx.setOptions({
      receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });
    var container = document.getElementById("castButtonContainer");
    if (container) {
      var launcher = document.createElement("google-cast-launcher");
      container.appendChild(launcher);
    }
    ctx.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, function (e) {
      if (
        e.sessionState === cast.framework.SessionState.SESSION_STARTED ||
        e.sessionState === cast.framework.SessionState.SESSION_RESUMED
      ) {
        castCurrentVideo();
      }
    });
  } catch (err) {
    console.warn("Cast init failed", err);
  }
}

function castCurrentVideo() {
  try {
    var session = cast.framework.CastContext.getInstance().getCurrentSession();
    if (!session || !currentCastVideoUrl) return;
    var mediaInfo = new chrome.cast.media.MediaInfo(currentCastVideoUrl, "video/mp4");
    var request = new chrome.cast.media.LoadRequest(mediaInfo);
    session.loadMedia(request).then(function () {}).catch(function () {});
  } catch (err) {
    console.warn("Cast load failed", err);
  }
}

// Presentation API: cast this page to a wireless display (e.g. Miracast, some smart TVs)
function castPage() {
  if (!navigator.presentation || !navigator.presentation.requestSession) {
    alert("Cast this page is not supported in this browser. Try Chrome and ensure a wireless display is available.");
    return;
  }
  var url = window.location.href;
  navigator.presentation.requestSession(url).then(function (session) {
    // Session started; the page is now shown on the wireless display
  }).catch(function (err) {
    alert("Could not connect to a display: " + (err.message || "unknown error"));
  });
}