export function safeImage(value) {
  if (!value) return '';
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  if (/^assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function validateMenu(menu) {
  if (!menu || menu.schemaVersion !== 1 || !menu.settings || !Array.isArray(menu.cocktails)) throw new Error('This is not a supported menu file.');
  if (typeof menu.settings.title !== 'string' || !menu.settings.title.trim() || typeof menu.settings.intro !== 'string' || typeof menu.settings.demo !== 'boolean') throw new Error('Menu title, introduction and example setting are required.');
  const ids = new Set();
  for (const drink of menu.cocktails) {
    if (typeof drink.id !== 'string' || !drink.id || ids.has(drink.id)) throw new Error('Every cocktail needs a unique ID.');
    ids.add(drink.id);
    for (const field of ['name', 'description', 'tastingNotes', 'recipe', 'image', 'imageAlt', 'imageCredit']) if (typeof drink[field] !== 'string') throw new Error(`Invalid ${field} in a cocktail.`);
    if (!drink.name.trim() || !Array.isArray(drink.ingredients) || !drink.ingredients.every(x => typeof x === 'string' && x.trim()) || !drink.ingredients.length || typeof drink.available !== 'boolean') throw new Error('Each cocktail needs a name, ingredients and availability.');
    if (drink.image && !safeImage(drink.image)) throw new Error('Use an HTTPS image URL or a JPEG, PNG or WebP upload.');
    if (drink.imageCrop !== undefined && !['top-left','top-right','bottom-left','bottom-right'].includes(drink.imageCrop)) throw new Error('Invalid image crop.');
  }
  return menu;
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
