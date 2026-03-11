async function findRecipes() {
  const textarea = document.getElementById('ingredients');
  const raw = textarea.value.trim();

  if (!raw) {
    showError('Please enter at least one ingredient.');
    return;
  }

  const ingredients = raw
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (ingredients.length === 0) {
    showError('Please enter at least one ingredient.');
    return;
  }

  setLoading(true);
  clearResults();
  clearError();

  try {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    renderRecipes(data.recipes);
  } catch (err) {
    showError('Network error — please check your connection and try again.');
  } finally {
    setLoading(false);
  }
}

function renderRecipes(recipes) {
  const section = document.getElementById('results');
  const container = document.getElementById('recipe-cards');

  if (!recipes || recipes.length === 0) {
    showError('No recipes found. Try adding more ingredients!');
    return;
  }

  container.innerHTML = '';

  recipes.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    const missing = recipe.missing_ingredients && recipe.missing_ingredients.length > 0
      ? `<div class="recipe-section">
           <h4>You'd also need</h4>
           <ul>${recipe.missing_ingredients.map(i => `<li class="missing-tag">${i}</li>`).join('')}</ul>
         </div>`
      : '';

    card.innerHTML = `
      <h3>${escapeHtml(recipe.name)}</h3>
      <p class="description">${escapeHtml(recipe.description)}</p>

      <div class="recipe-section">
        <h4>Ingredients you have</h4>
        <ul>${recipe.ingredients_needed.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
      </div>

      ${missing}

      <div class="recipe-section">
        <h4>Instructions</h4>
        <ol>${recipe.instructions.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      </div>
    `;

    container.appendChild(card);
  });

  section.classList.remove('hidden');
}

function setLoading(on) {
  const btn = document.getElementById('submit-btn');
  const loading = document.getElementById('loading');
  btn.disabled = on;
  loading.classList.toggle('hidden', !on);
}

function clearResults() {
  const section = document.getElementById('results');
  const container = document.getElementById('recipe-cards');
  section.classList.add('hidden');
  container.innerHTML = '';
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearError() {
  const el = document.getElementById('error-msg');
  el.textContent = '';
  el.classList.add('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Allow pressing Enter in textarea with Ctrl/Cmd
document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('ingredients');
  textarea.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      findRecipes();
    }
  });
});
