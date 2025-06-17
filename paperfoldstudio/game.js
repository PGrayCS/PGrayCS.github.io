// Complete browser version of Paperfold Studio idle clicker

const foldDisplay = document.getElementById('fold-display');
const rateDisplay = document.getElementById('rate-display');
const foldButton = document.getElementById('fold-button');
const hireAssistantButton = document.getElementById('hire-assistant-button');
const assistantInfo = document.getElementById('assistant-info');
const setList = document.getElementById('set-list');
const skillList = document.getElementById('skill-list');
const skillPointsEl = document.getElementById('skill-points');
const prestigeInfo = document.getElementById('prestige-info');
const prestigeButton = document.getElementById('prestige-button');
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const clearSaveButton = document.getElementById('clear-save-button');
const progressBar = document.getElementById('progress-bar');

let foldCount = 0;
let foldsPerClick = 1;
let assistantLevel = 0;
const baseAssistantCost = 10;
let baseFoldsPerSecond = 1;
let skillPoints = 0;
let prestigeCount = 0;
const prestigeBonus = 0.1;

let origamiSets = [
  { name: 'Crane Set', cost: 100, completed: false },
  { name: 'Flower Set', cost: 500, completed: false },
  { name: 'Dragon Set', cost: 2000, completed: false },
  { name: 'Garden Set', cost: 10000, completed: false }
];

let skills = [
  { name: 'Faster Assistants', cost: 1, purchased: false },
  { name: '+1 Fold/Click', cost: 1, purchased: false },
  { name: 'Double Fold/Click', cost: 2, purchased: false }
];

function assistantCost() {
  return Math.ceil(baseAssistantCost * Math.pow(1.15, assistantLevel));
}

function foldsPerSecond() {
  return assistantLevel * baseFoldsPerSecond * (1 + prestigeCount * prestigeBonus);
}

function spawnConfetti() {
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  const size = Math.random() * 6 + 4;
  confetti.style.backgroundColor = `hsl(${Math.random() * 360},100%,60%)`;
  confetti.style.width = `${size}px`;
  confetti.style.height = `${size}px`;
  const rect = foldButton.getBoundingClientRect();
  confetti.style.left = `${rect.left + rect.width / 2}px`;
  confetti.style.top = `${rect.top}px`;
  document.body.appendChild(confetti);
  setTimeout(() => confetti.remove(), 1000);
}

function updateDisplay() {
  foldDisplay.textContent = `Folds: ${Math.floor(foldCount)}`;
  rateDisplay.textContent = `Folds/s: ${foldsPerSecond().toFixed(1)}`;
  assistantInfo.textContent = `Level: ${assistantLevel} (${foldsPerSecond().toFixed(1)}/s) - Cost: ${assistantCost()}`;
  skillPointsEl.textContent = skillPoints;
  prestigeInfo.textContent = `Prestige count: ${prestigeCount}`;

  const next = origamiSets.find(set => !set.completed);
  if (next) {
    const percent = Math.min((foldCount / next.cost) * 100, 100);
    progressBar.style.width = percent + '%';
    progressBar.textContent = `${Math.floor(percent)}% to ${next.name}`;
  } else {
    progressBar.style.width = '100%';
    progressBar.textContent = 'All sets completed!';
  }

  // Update sets
  setList.innerHTML = '';
  origamiSets.forEach(set => {
    const li = document.createElement('li');
    li.textContent = set.completed ? `${set.name} - Completed` : `${set.name} - Cost: ${set.cost}`;
    setList.appendChild(li);
  });

  // Update skills
  skillList.innerHTML = '';
  skills.forEach((skill, index) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = skill.purchased ? `${skill.name} (Purchased)` : `${skill.name} - Cost: ${skill.cost}`;
    btn.disabled = skill.purchased || skillPoints < skill.cost;
    btn.addEventListener('click', () => purchaseSkill(index));
    li.appendChild(btn);
    skillList.appendChild(li);
  });
}

function addFold(amount) {
  foldCount += amount;
  updateDisplay();
}

function purchaseSkill(index) {
  const skill = skills[index];
  if (!skill || skill.purchased) return;
  if (skillPoints >= skill.cost) {
    skillPoints -= skill.cost;
    skill.purchased = true;
    if (skill.name === 'Faster Assistants') {
      baseFoldsPerSecond += 0.5;
    } else if (skill.name === '+1 Fold/Click') {
      foldsPerClick += 1;
    } else if (skill.name === 'Double Fold/Click') {
      foldsPerClick *= 2;
    }
    updateDisplay();
  }
}

function checkSets() {
  origamiSets.forEach(set => {
    if (!set.completed && foldCount >= set.cost) {
      set.completed = true;
      skillPoints += 1;
      for (let i = 0; i < 10; i++) {
        spawnConfetti();
      }
    }
  });
}

function hireAssistant() {
  const cost = assistantCost();
  if (foldCount >= cost) {
    foldCount -= cost;
    assistantLevel += 1;
    updateDisplay();
  }
}

function prestige() {
  prestigeCount += 1;
  foldCount = 0;
  skillPoints = 0;
  assistantLevel = 0;
  baseFoldsPerSecond = 1;
  foldsPerClick = 1;
  origamiSets.forEach(set => set.completed = false);
  skills.forEach(skill => skill.purchased = false);
  updateDisplay();
  for (let i = 0; i < 20; i++) {
    spawnConfetti();
  }
}

function resetGame() {
  foldCount = 0;
  skillPoints = 0;
  assistantLevel = 0;
  baseFoldsPerSecond = 1;
  foldsPerClick = 1;
  origamiSets.forEach(set => (set.completed = false));
  skills.forEach(skill => (skill.purchased = false));
}

function clearSave() {
  localStorage.removeItem('paperfold-save');
  resetGame();
  updateDisplay();
}

function tick() {
  addFold(foldsPerSecond());
  checkSets();
}

function saveGame() {
  const data = {
    foldCount,
    foldsPerClick,
    assistantLevel,
    baseFoldsPerSecond,
    skillPoints,
    prestigeCount,
    origamiSets,
    skills
  };
  localStorage.setItem('paperfold-save', JSON.stringify(data));
}

function loadGame() {
  const saved = localStorage.getItem('paperfold-save');
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    foldCount = data.foldCount || 0;
    foldsPerClick = data.foldsPerClick || 1;
    assistantLevel = data.assistantLevel || 0;
    baseFoldsPerSecond = data.baseFoldsPerSecond || 1;
    skillPoints = data.skillPoints || 0;
    prestigeCount = data.prestigeCount || 0;
    origamiSets = data.origamiSets || origamiSets;
    skills = data.skills || skills;
  } catch (e) {
    console.error('Failed to load save', e);
  }
  updateDisplay();
}

// Event wiring
foldButton.addEventListener('click', () => {
  addFold(foldsPerClick);
  for (let i = 0; i < 5; i++) {
    spawnConfetti();
  }
});

hireAssistantButton.addEventListener('click', hireAssistant);
prestigeButton.addEventListener('click', prestige);
saveButton.addEventListener('click', () => {
  saveGame();
  alert('Game saved!');
});
loadButton.addEventListener('click', () => {
  loadGame();
  alert('Game loaded!');
});
clearSaveButton.addEventListener('click', () => {
  clearSave();
  alert('Save cleared!');
});

document.addEventListener('DOMContentLoaded', () => {
  loadGame();
  updateDisplay();
  setInterval(tick, 1000);
  setInterval(saveGame, 30000);
});
