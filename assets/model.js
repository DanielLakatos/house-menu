export function safeImage(value) {
  if (!value) return '';
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  if (/^assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function validateMenu(menu) {
  if (!menu || menu.schemaVersion !== 1 || !menu.settings || !Array.isArray(menu.cocktails)) throw new Error('This is not a supported menu file.');
  if (typeof menu.settings.title !== 'string' || !menu.settings.title.trim() || typeof menu.settings.intro !== 'string' || typeof menu.settings.demo !== 'boolean') throw new Error('Menu title, introduction and example setting are required.');
  if (menu.additionalDrinks !== undefined && (!Array.isArray(menu.additionalDrinks) || !menu.additionalDrinks.every(item => typeof item === 'string' && item.trim()))) throw new Error('Other drinks must be a list of names.');
  const ids = new Set();
  for (const drink of menu.cocktails) {
    if (typeof drink.id !== 'string' || !drink.id || ids.has(drink.id)) throw new Error('Every cocktail needs a unique ID.');
    ids.add(drink.id);
    for (const field of ['name', 'description', 'tastingNotes', 'recipe', 'image', 'imageAlt', 'imageCredit']) if (typeof drink[field] !== 'string') throw new Error(`Invalid ${field} in a cocktail.`);
    if (!drink.name.trim() || !Array.isArray(drink.ingredients) || !drink.ingredients.every(x => typeof x === 'string' && x.trim()) || !drink.ingredients.length || typeof drink.available !== 'boolean') throw new Error('Each cocktail needs a name, ingredients and availability.');
    if (drink.image && !safeImage(drink.image)) throw new Error('Use an HTTPS image URL or a JPEG, PNG or WebP upload.');
    if (drink.imageCrop !== undefined && !['top-left','top-right','bottom-left','bottom-right'].includes(drink.imageCrop)) throw new Error('Invalid image crop.');
    if (drink.tags !== undefined && (!Array.isArray(drink.tags) || !drink.tags.every(tag => typeof tag === 'string' && tag.trim()))) throw new Error('Cocktail tags must be a list of words.');
  }
  return menu;
}
function searchable(value) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
export function findCocktails(cocktails, query = '') {
  const words = searchable(query).split(/\s+/).filter(Boolean);
  const entries = cocktails.filter(drink => drink.available).map(drink => {
    const text = searchable([drink.name, ...drink.ingredients, drink.tastingNotes, ...(drink.tags || [])].join(' '));
    return { drink, text, tokens: new Set(text.split(' ')) };
  });
  // Prefer whole words so gin does not also match ginger. Still accept partial names.
  const exactWords = new Set(words.filter(word => entries.some(entry => entry.tokens.has(word))));
  return entries.filter(entry => words.every(word => exactWords.has(word) ? entry.tokens.has(word) : entry.text.includes(word))).map(entry => entry.drink);
}
export const encodeText = text => {
  const bytes = new TextEncoder().encode(text); let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
};
export const decodeText = content => new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g, '')), c => c.charCodeAt(0)));
export function moveCocktail(menu, id, direction) {
  const index = menu.cocktails.findIndex(d => d.id === id), target = index + direction;
  if (index < 0 || target < 0 || target >= menu.cocktails.length) return;
  [menu.cocktails[index], menu.cocktails[target]] = [menu.cocktails[target], menu.cocktails[index]];
}
