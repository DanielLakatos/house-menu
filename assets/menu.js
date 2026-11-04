import { validateMenu, safeImage, findCocktails } from './model.js?v=3';

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function drinkCard(drink, index) {
  const card = el('article', 'drink');
  card.dataset.id = drink.id;
  const picture = el('div', 'drink-picture');
  const src = safeImage(drink.image);
  if (src) {
    const img = el('img');
    img.src = src;
    img.alt = drink.imageAlt || drink.name;
    if (['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(drink.imageCrop)) {
      img.className = 'photo-sheet ' + drink.imageCrop;
      picture.classList.add('sheet-frame');
    }
    img.loading = index < 2 ? 'eager' : 'lazy';
    img.addEventListener('error', () => {
      img.remove();
      picture.append(el('span', 'image-fallback', drink.name));
    }, { once: true });
    picture.append(img);
  } else picture.append(el('span', 'image-fallback', drink.name));

  const body = el('div', 'drink-body');
  const heading = el('div', 'drink-heading');
  heading.append(el('h2', '', drink.name), el('span', 'drink-number', String(index + 1).padStart(2, '0')));
  body.append(heading, el('p', 'tasting-notes', drink.tastingNotes), el('p', 'drink-description', drink.description));
  const details = el('details', 'recipe');
  const summary = el('summary', '', 'Ingredients & recipe');
  summary.setAttribute('aria-label', `Ingredients & recipe for ${drink.name}`);
  details.append(summary);
  const list = el('ul');
  drink.ingredients.forEach(item => list.append(el('li', '', item)));
  details.append(list, el('p', 'method', drink.recipe));
  if (drink.tags?.length) details.append(el('p', 'credit', 'Tags: ' + drink.tags.join(' · ')));
  if (drink.source?.name) details.append(el('p', 'credit', `Recipe adapted from ${drink.source.name}.`));
  if (drink.imageCredit) details.append(el('p', 'credit', drink.imageCredit));
  body.append(details);
  card.append(picture, body);
  return card;
}

if (document.querySelector('#drinks')) {
  const container = document.querySelector('#drinks');
  const search = document.querySelector('#cocktail-search');
  const clear = document.querySelector('#clear-search');
  const count = document.querySelector('#result-count');
  const controls = [...document.querySelectorAll('[data-view]')];
  const viewKey = 'house-menu-view-v1';
  let view = 'photos';
  try { if (localStorage.getItem(viewKey) === 'compact') view = 'compact'; } catch {}
  if (!search) view = 'photos';

  try {
    const response = await fetch(new URL('../data/menu.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error('Menu unavailable');
    const data = validateMenu(await response.json());
    document.title = data.settings.title;
    const eventTitle = document.querySelector('#event-title');
    if (eventTitle) eventTitle.textContent = data.settings.title;
    const available = findCocktails(data.cocktails);
    const cards = available.map((drink, index) => drinkCard(drink, index));
    container.replaceChildren(...cards);
    const empty = el('p', 'empty-state');
    empty.hidden = true;
    container.append(empty);

    function setView(next) {
      view = next;
      document.body.classList.toggle('compact-view', view === 'compact');
      for (const card of cards) {
        const picture = card.querySelector('.drink-picture');
        if (view === 'compact') card.querySelector('details').append(picture);
        else card.prepend(picture);
      }
      controls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
      try { localStorage.setItem(viewKey, view); } catch {}
    }

    function filter() {
      const query = search?.value.trim() || '';
      const matches = findCocktails(data.cocktails, query);
      const ids = new Set(matches.map(drink => drink.id));
      cards.forEach(card => { card.hidden = !ids.has(card.dataset.id); });
      empty.hidden = matches.length > 0;
      empty.textContent = query ? 'No cocktails match that search. Try a name, ingredient or taste.' : 'No cocktails on the menu right now. Ask your host what’s available.';
      if (count) count.textContent = query ? `${matches.length} of ${available.length} cocktails` : `${available.length} cocktails`;
      if (clear) clear.hidden = !search?.value;
    }

    search?.addEventListener('input', filter);
    search?.addEventListener('search', filter);
    search?.addEventListener('keydown', event => {
      if (event.key === 'Escape') { search.value = ''; filter(); }
    });
    clear?.addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
    controls.forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
    setView(view);
    filter();
    if (search) search.disabled = false;
    controls.forEach(button => { button.disabled = false; });

    const other = document.querySelector('#other-drinks');
    const otherList = document.querySelector('#other-drinks-list');
    const extras = data.additionalDrinks || [];
    if (other && otherList) {
      extras.forEach(name => otherList.append(el('li', '', name)));
      other.hidden = extras.length === 0;
    }
  } catch {
    container.replaceChildren(el('p', 'notice', 'The menu couldn’t load. Please refresh to try again.'));
    if (count) count.textContent = 'Menu unavailable';
  }
}
