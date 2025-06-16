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
  { name: 'Flower Set', cost: 500, completed: false }
];

let skills = [
  { name: 'Faster Assistants', cost: 1, purchased: false },
  { name: '+1 Fold/Click', cost: 1, purchased: false }
];

function assistantCost() {
  return Math.ceil(baseAssistantCost * Math.pow(1.15, assistantLevel));
}

function foldsPerSecond() {
  return assistantLevel * baseFoldsPerSecond * (1 + prestigeCount * prestigeBonus);
}

function updateDisplay() {
  foldDisplay.textContent = `Folds: ${Math.floor(foldCount)}`;
  rateDisplay.textContent = `Folds/s: ${foldsPerSecond().toFixed(1)}`;
  assistantInfo.textContent = `Level: ${assistantLevel} (${foldsPerSecond().toFixed(1)}/s) - Cost: ${assistantCost()}`;
  skillPointsEl.textContent = skillPoints;
  prestigeInfo.textContent = `Prestige count: ${prestigeCount}`;

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
    }
    updateDisplay();
  }
}

function checkSets() {
  origamiSets.forEach(set => {
    if (!set.completed && foldCount >= set.cost) {
      set.completed = true;
      skillPoints += 1;
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

document.addEventListener('DOMContentLoaded', () => {
  loadGame();
  updateDisplay();
  setInterval(tick, 1000);
});
