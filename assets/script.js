// ======================
// Global Variables
// ======================
let songs = [];        // All songs for selected year
let gameSongs = [];    // 11 songs for this game
let currentIndex = 0;  // Index in gameSongs
let score = 0;         // Player score

lastScoreDisplay();    // Show last score if available

// ======================
// Show Last Score
// ======================
function lastScoreDisplay() {
  const scoreUpdate = document.getElementById("game-intro");
  const previousScore = localStorage.getItem("score");

  if (previousScore) {
    let scorePara = document.getElementById("previous-score");
    if (scorePara) scorePara.remove();

    scorePara = document.createElement("p");
    scorePara.id = "previous-score";

    if (previousScore < 10) {
      scorePara.textContent = `Your last score was ${previousScore} / 10. Can you beat it?`;
    } else {
      scorePara.textContent = `Congratulations! You previously scored ${previousScore} / 10. Can you do it again?`;
    }

    scoreUpdate.appendChild(scorePara);
  }
}

// ======================
// Start Game
// ======================
function startGame() {
  const selectedYear = document.getElementById("yearDropdown").value;
  if (selectedYear === "placeholder") {
    alert("Please select a year to start the game.");
    return;
  }

  // Reset variables
  songs = [];
  gameSongs = [];
  currentIndex = 0;
  score = 0;
  document.getElementById("song-container").style.display = "none";

  // Try main JSON path
  let jsonPath = `./assets/json/${selectedYear}-EOY-Songs.json`;

  fetch(jsonPath)
    .then(response => {
      if (!response.ok) {
        // fallback to 'songs' subfolder
        jsonPath = `./assets/json/songs/${selectedYear}-EOY-Songs.json`;
        return fetch(jsonPath);
      }
      return response;
    })
    .then(response => {
      if (!response.ok) throw new Error("Songs JSON not found");
      return response.json();
    })
    .then(data => {
      songs = data.content.sections[0].content[0].content[0].chartItems.map(song => ({
        title: song.title,
        artist: song.artist,
        peak: song.peak,
        image: song.imageSrcSmall,
        audio: song.audioSrc
      }));

      gameSongs = getRandomSongs();
      showNextSong();

      document.getElementById("song-container").style.display = "block";
      document.getElementById("game-over").style.display = "none";
    })
    .catch(error => {
      alert("Could not load songs for the selected year.");
      console.error(error);
    });
}

// ======================
// Get 11 Random Songs
// ======================
function getRandomSongs(count = 11) {
  const validSongs = songs.filter(song => song.audio && song.image.includes("http"));
  if (!validSongs.length) {
    alert("No valid songs found for this year.");
    return [];
  }
  const shuffled = validSongs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ======================
// Show Next Song
// ======================
function showNextSong() {
  if (currentIndex >= gameSongs.length - 1 || gameSongs.length === 0) {
    endGame();
    return;
  }

  const currentSong = gameSongs[currentIndex];
  const nextSong = gameSongs[currentIndex + 1];

  document.getElementById("song-container").innerHTML = `
    <div class="game-wrapper row align-items-center">
      <div class="col-md-4">
        <div class="card">
          <div class="row align-items-center">
            <div class="col-5 col-md-12 image-container">
              <img src="${currentSong.image}" alt="${currentSong.title}" class="object-fit-contain img-fluid">
            </div>
            <div class="col-7 col-md-12">
              <h3>${currentSong.title}</h3>
              <p>by ${currentSong.artist}</p>
              <audio controls src="${currentSong.audio}"></audio>
              <p class="chart-position">Peak Position: ${currentSong.peak}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="vs">
          <h3>Banger or Clanger?</h3>
          <h4>Did the new song on the right chart:</h4>
          <button class="game-button" onclick="guess('lower')">Lower</button>
          <button class="game-button" onclick="guess('same')">Same</button>
          <button class="game-button" onclick="guess('higher')">Higher</button>

          <div id="notifications" class="row m-auto"></div>
          <div class="row m-auto">
            <p id="score-tracking">Score: ${score} / 10</p>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card">
          <div class="row align-items-center">
            <div class="col-5 col-md-12 image-container">
              <img src="${nextSong.image}" alt="${nextSong.title}" class="object-fit-contain img-fluid">
            </div>
            <div class="col-7 col-md-12">
              <h3>${nextSong.title}</h3>
              <p>by ${nextSong.artist}</p>
              <audio controls src="${nextSong.audio}"></audio>
              <p class="chart-position hidden">Peak Position: ???</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ======================
// Guess Logic
// ======================
function guess(playerGuess) {
  const currentSong = gameSongs[currentIndex];
  const nextSong = gameSongs[currentIndex + 1];
  let correct = false;

  if (playerGuess === "higher" && nextSong.peak < currentSong.peak) correct = true;
  if (playerGuess === "lower" && nextSong.peak > currentSong.peak) correct = true;
  if (playerGuess === "same" && nextSong.peak === currentSong.peak) correct = true;

  const notifications = document.getElementById("notifications");
  const scoreDisplay = document.getElementById("score-tracking");

  notifications.innerHTML = `
    <p>${correct ? "Correct! ✅" : "Wrong! ❌"}</p>
    <p>The next song peaked at position ${nextSong.peak}.</p>
  `;

  if (correct) score++;
  scoreDisplay.textContent = `Score: ${score} / 10`;

  document.querySelectorAll(".game-button").forEach(btn => btn.disabled = true);

  currentIndex++;
  setTimeout(showNextSong, 1000);
}

// ======================
// End Game
// ======================
function endGame() {
  document.getElementById("song-container").style.display = "none";
  document.getElementById("game-over").style.display = "block";
  document.getElementById("score").innerHTML = `<p>Your score: ${score} / 10</p>`;

  localStorage.setItem("score", score);
  lastScoreDisplay();

  songs = [];
  gameSongs = [];
  currentIndex = 0;
  score = 0;
  document.getElementById("yearDropdown").selectedIndex = 0;
}

// ======================
// Facebook Share
// ======================
const fbButton = document.getElementById('fb-share-button');
const url = window.location.href;
fbButton.addEventListener('click', () => {
  window.open(
    'https://www.facebook.com/sharer/sharer.php?u=' + url,
    'facebook-share-dialog',
    'width=800,height=600'
  );
  return false;
});

// ======================
// Font Selector
// ======================
document.getElementById('fontSelector').addEventListener('change', function() {
  if (this.value !== 'placeholder') {
    document.documentElement.style.setProperty('--primary-font', this.value);
  }
});