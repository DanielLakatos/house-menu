import { validateMenu, safeImage } from './model.js';
export function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
export function drinkCard(drink, index) {
  const card = el('article', 'drink');
  const picture = el('div', 'drink-picture'); const src = safeImage(drink.image);
  if (src) { const img = el('img'); img.src = src; img.alt = drink.imageAlt || drink.name; if (['top-left','top-right','bottom-left','bottom-right'].includes(drink.imageCrop)) { img.className = 'photo-sheet ' + drink.imageCrop; picture.classList.add('sheet-frame'); } img.loading = index < 2 ? 'eager' : 'lazy'; img.addEventListener('error', () => { img.remove(); picture.append(el('span', 'image-fallback', drink.name)); }, { once: true }); picture.append(img); }
  else picture.append(el('span', 'image-fallback', drink.name));
  const body = el('div', 'drink-body'); const heading = el('div', 'drink-heading'); heading.append(el('h2', '', drink.name), el('span', 'drink-number', String(index + 1).padStart(2, '0')));
  body.append(heading, el('p', 'tasting-notes', drink.tastingNotes), el('p', 'drink-description', drink.description));
  const details = el('details', 'recipe'); details.append(el('summary', '', 'Ingredients & recipe'));
  const list = el('ul'); drink.ingredients.forEach(item => list.append(el('li', '', item))); details.append(list, el('p', 'method', drink.recipe));
  if (drink.imageCredit) details.append(el('p', 'credit', drink.imageCredit));
  body.append(details); card.append(picture, body); return card;
}
if (document.querySelector('#drinks')) {
  try {
    const response = await fetch(new URL('../data/menu.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error('Menu unavailable');
    const data = validateMenu(await response.json());
    document.title = data.settings.title; document.querySelector('#menu-title').textContent = data.settings.title; document.querySelector('#menu-intro').textContent = data.settings.intro;
    document.querySelector('#demo-note').hidden = !data.settings.demo;
    const drinks = data.cocktails.filter(drink => drink.available); const container = document.querySelector('#drinks'); container.replaceChildren();
    document.querySelector('#menu-count').textContent = `${drinks.length} ${drinks.length === 1 ? 'drink' : 'drinks'}`;
    if (!drinks.length) container.append(el('p', 'empty-state', 'The menu is taking a little break. Ask your host what’s pouring.'));
    drinks.forEach((drink, index) => container.append(drinkCard(drink, index)));
  } catch { const container = document.querySelector('#drinks'); container.replaceChildren(el('p', 'notice', 'The menu couldn’t load. Please refresh to try again.')); }
}
