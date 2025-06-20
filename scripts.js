const chords = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
let transposeValues = {};
let scrollInterval = null;

const songsData = [];

function transposeChord(chord, steps) {
  const root = chord.match(/[A-G][#b]?/);
  if (!root) return chord;
  const i = chords.indexOf(root[0].replace('Db', 'C#').replace('Eb', 'D#'));
  if (i < 0) return chord;
  const newIndex = (i + steps + 12) % 12;
  return chord.replace(root[0], chords[newIndex]);
}

function getTransposed(raw, transpose) {
  const regex = /\b([A-G][#b]?m?7?)\b/g; // Matches G, D, Em, A7, etc.
  const lines = raw.split('\n');
  return lines
    .map(line => {
      if (line.startsWith('[') && line.endsWith(']')) {
        return line; // Leave section titles like [Verse 1]
      }
      return line.replace(regex, (match) => `<b>${transposeChord(match, transpose)}</b>`);
    })
    .join('\n');
}

function renderSongs() {
  const container = document.getElementById("songs");
  container.innerHTML = "";

  // Save current state to localStorage
  localStorage.setItem("songsData", JSON.stringify(songsData));
  localStorage.setItem("transposeValues", JSON.stringify(transposeValues));

  songsData.forEach(song => {
    const fav = localStorage.getItem(`fav_${song.id}`) === 'true';
    const transpose = transposeValues[song.id] || 0;
    const html = `
      <h2>
        ${song.title} 
        <button onclick="toggleFavorite('${song.id}')">${fav ? '★' : '☆'}</button>
        <button onclick="deleteSong('${song.id}')">🗑️</button>
      </h2>
      <div class="controls">
        <button onclick="transposeSong('${song.id}', -1)">Transpose -</button>
        <span style="margin: 0 10px;">Key: ${transpose >= 0 ? '+' + transpose : transpose}</span>
        <button onclick="transposeSong('${song.id}', 1)">Transpose +</button>
      </div>
      <pre><code>${getTransposed(song.raw, transpose)}</code></pre>
    `;
    container.innerHTML += html;
  });
}

function transposeAll(step) {
  songsData.forEach(song => {
    transposeValues[song.id] = (transposeValues[song.id] || 0) + step;
  });
  renderSongs();
}

function toggleFavorite(id) {
  const current = localStorage.getItem(`fav_${id}`);
  localStorage.setItem(`fav_${id}`, current === 'true' ? 'false' : 'true');
  renderSongs();
}

function toggleScroll() {
  const speed = document.getElementById("scrollSpeed").value;
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  } else {
    scrollInterval = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'smooth' });
    }, speed);
  }
}

function importSong(event) {
  const file = event.target.files[0];
  if (!file || file.type !== "text/plain") {
    alert("Please select a valid .txt file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const raw = e.target.result;
    if (!raw.trim()) {
      alert("The file is empty.");
      return;
    }

    const id = `imported_${Date.now()}`;
    const title = file.name.replace(/\\.txt$/, '');
    songsData.push({ id, title, raw });
    transposeValues[id] = 0; // Init transpose value
    renderSongs();
    event.target.value = ''; // Reset file input so you can re-upload the same file
  };
  reader.onerror = function() {
    alert("Failed to read the file.");
  };

  reader.readAsText(file);
}

function deleteSong(id) {
  // Remove from songsData
  const index = songsData.findIndex(song => song.id === id);
  if (index !== -1) {
    songsData.splice(index, 1);
  }

  // Remove related data
  delete transposeValues[id];
  localStorage.removeItem(`fav_${id}`);
  localStorage.setItem("songsData", JSON.stringify(songsData));
  localStorage.setItem("transposeValues", JSON.stringify(transposeValues));

  renderSongs();
}
function transposeSong(id, step) {
  transposeValues[id] = (transposeValues[id] || 0) + step;
  renderSongs();
}

// Load from localStorage
const savedSongs = localStorage.getItem("songsData");
const savedTranspose = localStorage.getItem("transposeValues");

if (savedSongs) songsData.push(...JSON.parse(savedSongs));
if (savedTranspose) Object.assign(transposeValues, JSON.parse(savedTranspose));

document.addEventListener("DOMContentLoaded", renderSongs);

document.getElementById("scrollSpeed").addEventListener("input", () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    const speed = document.getElementById("scrollSpeed").value;
    scrollInterval = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'smooth' });
    }, speed);
  }
});