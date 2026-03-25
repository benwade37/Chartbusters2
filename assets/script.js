// Initial Global Variable Definition
let songs = []; // Global array to store songs
let currentIndex = 0; // Track which song we're on
let score = 0; // Track correct answers
let gameSongs = []; // Will hold the 11 random songs
lastScoreDisplay(); // Display last score if available

// Function to display the last score if available (stored locally)
function lastScoreDisplay() {
  const scoreUpdate = document.getElementById("game-intro");
  const previousScore = localStorage.getItem("score");

  if (previousScore) {
    const scoreUpdateParagraph = document.createElement("p");
    scoreUpdateParagraph.id = "previous-score";

    if (document.getElementById("previous-score")) {
      document.getElementById("previous-score").remove();
    }

    if (previousScore < 10) {
      scoreUpdateParagraph.textContent = `Your last score was ${previousScore} / 10. Can you beat it?`;
    } else if (previousScore == 10) {
      scoreUpdateParagraph.textContent = `Congratulations! You previously scored ${previousScore} / 10. Can you do it again?`;
    }

    scoreUpdate.appendChild(scoreUpdateParagraph);
  }
}

// Start Game Function (Dynamic JSON Path)
function startGame() {
  const selectedYear = document.getElementById("yearDropdown").value;
  if (selectedYear === "placeholder") {
    alert("Please select a year to start the game.");
    return;
  }

  // Reset global variables
  songs = [];
  currentIndex = 0;
  score = 0;
  gameSongs = [];
  document.getElementById("song-container").style.display = "none";

  // Try main folder first
  let jsonPath = `./assets/json/${selectedYear}-EOY-Songs.json`;

  fetch(jsonPath)
    .then((response) => {
      if (!response.ok) {
        // If file not found, fallback to 'songs' subfolder
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

// Function to get 11 random songs from the songs array (1 start + 10 questions)
function getRandomSongs(count = 11) {
  const validSongs = songs.filter((song) => song.audio && song.image.includes("http"));
  const shuffled = validSongs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to display the next song in the game until 10 songs have been played
function showNextSong() {
  if (currentIndex >= 10) {
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
          <button class="game-button" onclick="guess('lower', ${currentSong.peak}, ${nextSong.peak})">Lower</button>
          <button class="game-button" onclick="guess('same', ${currentSong.peak}, ${nextSong.peak})">Same</button>
          <button class="game-button" onclick="guess('higher', ${currentSong.peak}, ${nextSong.peak})">Higher</button>

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

// Function to check if the player's guess was correct
function guess(playerGuess, currentPeak, nextPeak) {
  let correct = false;

  if (playerGuess === "higher" && nextPeak > currentPeak) correct = true;
  if (playerGuess === "lower" && nextPeak < currentPeak) correct = true;
  if (playerGuess === "same" && nextPeak === currentPeak) correct = true;

  const notificationArea = document.getElementById("notifications");
  const scoreArea = document.getElementById("score-tracking");

  const notification = document.createElement("p");
  notification.textContent = correct ? "Correct! ✅" : "Wrong! ❌";
  notificationArea.appendChild(notification);

  const scoreNotification = document.createElement("p");
  scoreNotification.textContent = `The next song peaked at position ${nextPeak}.`;
  notificationArea.appendChild(scoreNotification);

  if (correct) score++;
  scoreArea.textContent = `Score: ${score} / 10`;

  // Disable buttons to prevent multiple clicks
  document.querySelectorAll(".game-button").forEach((btn) => (btn.disabled = true));

  // Next Song Button
  const nextSongButton = document.createElement("button");
  nextSongButton.textContent = "Next Song";
  nextSongButton.onclick = showNextSong;
  notificationArea.appendChild(nextSongButton);
}

// Function to end the game
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

// Facebook Share Button
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

// Font Selector
document.getElementById('fontSelector').addEventListener('change', function() {
  const selectedFont = this.value;
  if (selectedFont !== 'placeholder') {
    document.documentElement.style.setProperty('--primary-font', selectedFont);
  }
});