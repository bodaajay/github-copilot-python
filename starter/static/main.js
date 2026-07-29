// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let timerInterval = null;
let elapsedSeconds = 0;
let currentDifficulty = 'easy';

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateTimer() {
  elapsedSeconds += 1;
  document.getElementById('timer').innerText = formatTime(elapsedSeconds);
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  document.getElementById('timer').innerText = formatTime(elapsedSeconds);
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function applyTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-mode');
    document.getElementById('theme-toggle').innerText = 'Light Mode';
  } else {
    body.classList.remove('dark-mode');
    document.getElementById('theme-toggle').innerText = 'Dark Mode';
  }
  localStorage.setItem('sudokuTheme', theme);
}

function loadTheme() {
  const theme = localStorage.getItem('sudokuTheme') || 'light';
  applyTheme(theme);
}

function getBoardState() {
  const board = [];
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  return board;
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      const blockClass = (Math.floor(i / 3) + Math.floor(j / 3)) % 2 === 0 ? 'block-even' : 'block-odd';
      input.classList.add(blockClass);
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        e.target.classList.remove('incorrect', 'hint');
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      inp.classList.remove('incorrect', 'hint');
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.classList.add('prefilled');
      } else {
        inp.value = '';
        inp.disabled = false;
        inp.classList.remove('prefilled');
      }
    }
  }
  document.getElementById('message').innerText = '';
  startTimer();
}

function loadScoreboard() {
  const stored = localStorage.getItem('sudokuScoreboard');
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveScoreboard(scores) {
  localStorage.setItem('sudokuScoreboard', JSON.stringify(scores.slice(0, 10)));
}

function renderScoreboard() {
  const rows = document.querySelector('#scoreboard tbody');
  const scores = loadScoreboard();
  rows.innerHTML = '';
  if (scores.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">No scores yet</td>';
    rows.appendChild(row);
    return;
  }
  scores.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${formatTime(entry.time)}</td>
      <td>${entry.difficulty}</td>
      <td>${new Date(entry.date).toLocaleDateString()}</td>
    `;
    rows.appendChild(row);
  });
}

function registerScore() {
  const scores = loadScoreboard();
  scores.push({
    time: elapsedSeconds,
    difficulty: currentDifficulty,
    date: new Date().toISOString(),
  });
  scores.sort((a, b) => a.time - b.time);
  saveScoreboard(scores);
  renderScoreboard();
}

async function newGame() {
  const select = document.getElementById('difficulty-selector');
  currentDifficulty = select.value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(currentDifficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
}

async function checkSolution() {
  const board = getBoardState();
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board}),
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const incorrect = new Set(data.incorrect.map(x => x[0] * SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.classList.remove('incorrect', 'hint');
    if (incorrect.has(idx)) {
      inp.classList.add('incorrect');
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
    stopTimer();
    registerScore();
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

async function requestHint() {
  const board = getBoardState();
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board}),
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const index = data.row * SIZE + data.col;
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const inp = inputs[index];
  inp.value = data.value;
  inp.disabled = true;
  inp.classList.remove('incorrect');
  inp.classList.add('hint');
  msg.style.color = '#388e3c';
  msg.innerText = 'Hint applied! One correct cell has been revealed.';
}

window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint-button').addEventListener('click', requestHint);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const theme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(theme);
  });
  loadTheme();
  renderScoreboard();
  newGame();
});
