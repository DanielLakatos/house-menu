import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findCocktails,validateMenu} from '../assets/model.js';
const menu=JSON.parse(await readFile(new URL('../data/menu.json',import.meta.url),'utf8'));
const ids=query=>findCocktails(menu.cocktails,query).map(drink=>drink.id);
test('search finds cocktail names and ingredient words without exposing hidden drinks',()=>{
 assert.deepEqual(ids('negroni'),['negroni']);
 assert.deepEqual(ids('negr'),['negroni']);
 assert.ok(ids('Campari').includes('negroni'));
 assert.ok(ids('gin').includes('negroni'));
 assert.ok(!ids('gin').includes('kentucky-buck'));
 assert.deepEqual(ids('margarita'),[]);
 assert.equal(ids(' ').length,menu.cocktails.filter(drink=>drink.available).length);
});
test('each search word must match, regardless of word order or accents',()=>{
 assert.ok(ids('LEMON GIN').includes('southside'));
 assert.ok(!ids('LEMON GIN').includes('whiskey-smash'));
 assert.deepEqual(ids('BENEDICTINE SCOTCH'),['pantheon','death-and-taxes']);
 assert.deepEqual(ids('negroni impossibleword'),[]);
});
test('tasting notes and explicit tags participate without matching incidental serving descriptions',()=>{
 assert.ok(ids('fresh').includes('mint-julep'));
 assert.ok(!ids('fresh').includes('old-fashioned'));
 const drink={...menu.cocktails[0],tags:['garden party'],available:true};
 assert.equal(findCocktails([drink],'garden').length,1);
 assert.equal(findCocktails([drink],'silky').length,1);
});
test('new metadata is optional for old backups and validated when supplied',()=>{
 const old=structuredClone(menu);delete old.additionalDrinks;old.cocktails.forEach(drink=>delete drink.tags);assert.doesNotThrow(()=>validateMenu(old));
 for(const invalid of [false,[{}],['']]){const next=structuredClone(menu);next.additionalDrinks=invalid;assert.throws(()=>validateMenu(next),/Other drinks/);}
 const next=structuredClone(menu);next.cocktails[0].tags='fresh';assert.throws(()=>validateMenu(next),/tags/);
});
