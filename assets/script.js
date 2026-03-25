// ======================
// Global Variables
// ======================
let songs = []; // All songs for the selected year
let currentIndex = 0; // Which song we are on
let score = 0; // Player score
let gameSongs = []; // 11 random songs for this game

lastScoreDisplay(); // Show last score if available

// ======================
// Display Last Score
// ======================
function lastScoreDisplay() {
  const scoreUpdate = document.getElementById("game-intro");
  const previousScore = localStorage.getItem("score");

  if (previousScore) {
    const scoreUpdateParagraph = document.createElement("p");
    scoreUpdateParagraph.id = "previous-score";

    if (document.getElementById("previous-score")) {
      document.getElementById("previous-score").remove();
    }

    scoreUpdateParagraph.textContent =
      previousScore < 10
        ? `Your last score was ${previousScore} / 10. Can you beat it?`
        : `Congratulations! You previously scored ${previousScore} / 10. Can you do it again?`;

    scoreUpdate.appendChild(scoreUpdateParagraph);
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

  // Reset game
  songs = [];
  currentIndex = 0;
  score = 0;
  gameSongs = [];
  document.getElementById("song-container").style.display = "none";

  // Dynamic JSON path
  let jsonPath = `./assets/json/${selectedYear}-EOY-Songs.json`;

  fetch(jsonPath)
    .then((response) => {
      if (!response.ok) {
        // fallback to subfolder
        jsonPath = `./assets/json/songs/${selectedYear}-EOY-Songs.json`;
        return fetch(jsonPath);
      }
      return response;
    })
    .then((response) => {
      if (!response.ok) throw new Error("Songs JSON not found");
      return response.json();
    })
    .then((data) => {
      songs = data.content.sections[0].content[0].content[0].chartItems.map(
        (song) => ({
          title: song.title,
          artist: song.artist,
          peak: song.peak,
          image: song.imageSrcSmall,
          audio: song.audioSrc,
        })
      );

      gameSongs = getRandomSongs();
      showNextSong();

      document.getElementById("song-container").style.display = "block";
      document.getElementById("game-over").style.display = "none";
    })
    .catch((error) => {
      alert("Could not load songs for the selected year.");
      console.error(error);
    });
}

// ======================
// Get Random Songs
// ======================
function getRandomSongs(count = 11) {
  const validSongs = songs.filter((song) => song.audio && song.image.includes("http"));

  if (validSongs.length === 0) {
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

  if (!currentSong || !nextSong) {
    console.error("Missing song data", currentIndex, gameSongs);
    endGame();
    return;
  }

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
// Guess Function
// ======================
function guess(playerGuess) {
  const currentSong = gameSongs[currentIndex];
  const nextSong = gameSongs[currentIndex + 1];
  let correct = false;

  // Correct higher/lower logic
  if (playerGuess === "higher" && nextSong.peak < currentSong.peak) correct = true;
  if (playerGuess === "lower" && nextSong.peak > currentSong.peak) correct = true;
  if (playerGuess === "same" && nextSong.peak === currentSong.peak) correct = true;

  const notifications = document.getElementById("notifications");
  const scoreDisplay = document.getElementById("score-tracking");

  // Clear previous notifications
  notifications.innerHTML = "";

  // Show result
  const result = document.createElement("p");
  result.textContent = correct ? "Correct! ✅" : "Wrong! ❌";
  notifications.appendChild(result);

  const peakInfo = document.createElement("p");
  peakInfo.textContent = `The next song peaked at position ${nextSong.peak}.`;
  notifications.appendChild(peakInfo);

  // Update score
  if (correct) score++;
  scoreDisplay.textContent = `Score: ${score} / 10`;

  // Disable guess buttons
  document.querySelectorAll(".game-button").forEach(btn => btn.disabled = true);

  // Add "Next Song" button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next Song";
  nextButton.className = "game-button";
  nextButton.onclick = () => {
    currentIndex++;
    showNextSong();
  };
  notifications.appendChild(nextButton);
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
  currentIndex = 0;
  score = 0;
  gameSongs = [];
  document.getElementById("yearDropdown").selectedIndex = 0;
}

// ======================
// Facebook Share Button
// ======================
const fbButton = document.getElementById('fb-share-button');
const url = window.location.href;
fbButton.addEventListener('click', function () {
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
  const selectedFont = this.value;
  if (selectedFont !== 'placeholder') {
    document.documentElement.style.setProperty('--primary-font', selectedFont);
  }
});