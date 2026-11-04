import { validateMenu, safeImage, moveCocktail } from './model.js?v=3';
import { GitHubMenu } from './github.js?v=3';
import { el } from './menu.js?v=3';
const $ = selector => document.querySelector(selector);
const form = $('#cocktail-form');
const storageKey = 'house-menu-draft-v1:' + location.pathname;
let menu, selected, client, config, revision = 0, publishedRevision = 0, lastDraft = '', busy = false, ready = false;
const fields = ['name','description','tastingNotes','ingredients','recipe','image','imageAlt','imageCredit','available'];
if (form.elements.namedItem('tags')) fields.push('tags');
const field = name => form.elements.namedItem(name);
function status(message, error = false) { $('#status').textContent = message; $('#status').classList.toggle('error', error); }
function persist() {
  revision++;
  lastDraft = JSON.stringify(menu);
  try { localStorage.setItem(storageKey, lastDraft); $('#dirty').textContent = 'Draft saved on this device'; }
  catch { $('#dirty').textContent = 'Draft is only in this tab. Export a backup before closing.'; }
}
function imagePreview() {
  const drink = menu.cocktails.find(d => d.id === selected); const preview = $('#image-preview'); const src = safeImage(drink?.image);
  preview.hidden = !src; if (src) preview.src = new URL(src, new URL('../', import.meta.url)).href;
  preview.onerror = () => { preview.hidden = true; };
}
function capture() {
  const drink = menu.cocktails.find(d => d.id === selected); if (!drink) return;
  for (const name of fields) {
    if (name === 'available') drink[name] = field(name).checked;
    else if (name === 'ingredients' || name === 'tags') drink[name] = field(name).value.split(name === 'tags' ? ',' : '\n').map(x=>x.trim()).filter(Boolean);
    else if (name !== 'image' || field(name).value !== '[Uploaded image]') drink[name] = field(name).value;
  }
  persist(); renderList();
}
function renderList() {
  const list = $('#cocktail-list'); list.replaceChildren();
  menu.cocktails.forEach(drink => { const button = el('button','list-item'); button.type = 'button'; button.setAttribute('aria-pressed', String(drink.id === selected)); button.append(el('strong','',drink.name || 'Untitled cocktail'),el('span','',drink.available ? 'On the menu' : 'Hidden from guests')); button.addEventListener('click',()=>{ selected=drink.id; renderEditor(); renderList(); }); list.append(button); });
}
function renderEditor() {
  const drink = menu.cocktails.find(d => d.id === selected); form.hidden = !drink; $('#editor-empty').hidden = !!drink;
  if (!drink) return;
  for (const name of fields) {
    if (name === 'available') field(name).checked = drink[name];
    else if (name === 'ingredients' || name === 'tags') field(name).value = (drink[name] || []).join(name === 'tags' ? ', ' : '\n');
    else field(name).value = name === 'image' && drink.image.startsWith('data:') ? '[Uploaded image]' : drink[name];
  }
  $('#image-upload').value = ''; imagePreview(); const index = menu.cocktails.indexOf(drink); $('#up').disabled = index === 0; $('#down').disabled = index === menu.cocktails.length - 1;
}
function render() { renderList(); renderEditor(); $('#title').value=menu.settings.title; $('#intro').value=menu.settings.intro; $('#demo').checked=menu.settings.demo; if($('#additional-drinks')) $('#additional-drinks').value=(menu.additionalDrinks || []).join('\n'); renderQr(); }
function renderQr() {
  const url = new URL('../',location.href).href; $('#guest-url').textContent = url; $('#qr-title').textContent = menu.settings.title || 'House menu';
  if (!globalThis.qrcode) { $('#qr-image').textContent='QR generator unavailable. Refresh to retry.'; return; }
  const code = globalThis.qrcode(0,'M'); code.addData(url); code.make();
  const svg=code.createSvgTag({cellSize:8,margin:32,scalable:true}); const blob=new Blob([svg],{type:'image/svg+xml'}); const previous=$('#download-qr').getAttribute('href'); if(previous?.startsWith('blob:')) URL.revokeObjectURL(previous);
  const href=URL.createObjectURL(blob); const image=el('img'); image.src=href; image.alt='QR code linking to the guest cocktail menu'; $('#qr-image').replaceChildren(image); $('#download-qr').href=href;
}
function exportBackup() { const link=el('a'); const url=URL.createObjectURL(new Blob([JSON.stringify(menu,null,2)+'\n'],{type:'application/json'})); link.href=url; link.download='house-menu-backup.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
function setBusy(value) { busy=value; $('#connect').disabled=value; $('#publish').disabled=value||!client; $('#disconnect').disabled=value; $('#import').disabled=value; }
async function uploadImage(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.');
  if(file.size>20*1024*1024) throw new Error('Choose an image smaller than 20 MB.');
  const bitmap=await createImageBitmap(file); const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height)); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale)); canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close(); return canvas.toDataURL('image/webp',.78);
}
try {
  const responses=await Promise.all([fetch('../data/menu.json',{cache:'no-store'}),fetch('../data/config.json')]); if(responses.some(r=>!r.ok)) throw new Error('The menu files could not load. Refresh to try again.');
  menu=validateMenu(await responses[0].json()); config=await responses[1].json(); let restored=false;
  try { const draft=localStorage.getItem(storageKey); if(draft) { const parsed=JSON.parse(draft); if(parsed.schemaVersion===1&&parsed.settings&&Array.isArray(parsed.cocktails)) { menu=parsed; restored=true; revision++; } } } catch { status('The saved draft could not be read. The published menu has been loaded.',true); }
  selected=menu.cocktails[0]?.id; lastDraft=JSON.stringify(menu); ready=true;
  $('#repo-label').textContent=`${config.owner}/${config.repo}`;
  $('#token-link').href=`https://github.com/settings/personal-access-tokens/new?name=House%20menu&description=Publish%20my%20cocktail%20menu&target_name=${encodeURIComponent(config.owner)}&contents=write`;
  render(); status(restored?'Your saved draft is ready. Connect to GitHub when you want to publish.':'Ready to edit. Changes save as a draft on this device.');
} catch(error) { status(error.message,true); document.querySelectorAll('button,input,textarea').forEach(node=>node.disabled=true); }
if(ready) {
  form.addEventListener('input',event=>{ if(event.target===field('image')) { const drink=menu.cocktails.find(d=>d.id===selected); delete drink.imageCrop; } capture(); if(event.target===field('image')) imagePreview(); });
  form.addEventListener('submit',event=>{event.preventDefault(); capture(); try { validateMenu(menu); status('Cocktail saved to your draft. Publish when the menu is ready.'); } catch(error) { status(error.message,true); }});
  $('#add').addEventListener('click',()=>{ const drink={id:crypto.randomUUID(),name:'New cocktail',description:'',tastingNotes:'',tags:[],ingredients:['Add an ingredient'],recipe:'',image:'',imageAlt:'',imageCredit:'',available:false}; menu.cocktails.push(drink); selected=drink.id; persist(); renderList(); renderEditor(); field('name').focus(); status('New cocktail added to your draft. It stays hidden until you choose to show it.'); });
  $('#delete').addEventListener('click',()=>{ if(!confirm('Delete this cocktail from your draft? The live menu changes only when you publish.')) return; menu.cocktails=menu.cocktails.filter(d=>d.id!==selected); selected=menu.cocktails[0]?.id; persist(); renderList(); renderEditor(); status('Cocktail removed from the draft.'); });
  for(const [id,direction] of [['up',-1],['down',1]]) $('#'+id).addEventListener('click',()=>{ moveCocktail(menu,selected,direction); persist(); renderList(); renderEditor(); });
  $('#image-upload').addEventListener('change',async event=>{const file=event.target.files[0]; if(!file)return; const drink=menu.cocktails.find(d=>d.id===selected); try{const image=await uploadImage(file); drink.image=image; delete drink.imageCrop; persist(); if(selected===drink.id)renderEditor(); status('Image added to your draft.');}catch(error){status(error.message,true);}});
  $('#remove-image').addEventListener('click',()=>{const drink=menu.cocktails.find(d=>d.id===selected); drink.image=''; delete drink.imageCrop; persist(); renderEditor();});
  for(const key of ['title','intro','demo']) $('#'+key).addEventListener('input',()=>{menu.settings[key]=key==='demo'?$('#demo').checked:$('#'+key).value; persist(); if(key==='title')renderQr();});
  $('#additional-drinks')?.addEventListener('input',()=>{menu.additionalDrinks=$('#additional-drinks').value.split('\n').map(name=>name.trim()).filter(Boolean);persist();});
  $('#export').addEventListener('click',exportBackup);
  $('#import').addEventListener('change',async event=>{ const file=event.target.files[0]; if(!file)return; try{if(file.size>20*1024*1024)throw new Error('Choose a backup smaller than 20 MB.'); const imported=validateMenu(JSON.parse(await file.text())); if(!confirm('Replace this device’s draft with the imported menu? Export a backup first if you want to keep the current draft.'))return; menu=imported; selected=menu.cocktails[0]?.id;persist();render();status('Backup imported as a draft. Publish to update the guest menu.');}catch(error){status(error.message,true);}finally{event.target.value='';}});
  $('#connect').addEventListener('click',async()=>{
    const token=$('#token').value.trim(); if(!token)return status('Paste a GitHub token to connect.',true);
    if(revision!==publishedRevision&&!confirm('Load the latest live menu and replace this device’s draft? Cancel to export a backup first.'))return;
    setBusy(true); const startRevision=revision; const connection=new GitHubMenu(config,token);
    try{ const live=await connection.load(); if(revision!==startRevision){connection.disconnect();throw new Error('Your draft changed while connecting. Export a backup, then reconnect when you’re ready.');} client?.disconnect();client=connection;menu=live;selected=menu.cocktails[0]?.id;persist();publishedRevision=revision;render();$('#token').value='';$('#disconnect').hidden=false;$('#connection').open=false;status('Connected to GitHub. The latest live menu is loaded.'); }
    catch(error){connection.disconnect();status(error.message,true);}finally{setBusy(false);}
  });
  $('#disconnect').addEventListener('click',()=>{client?.disconnect();client=null;$('#token').value='';$('#disconnect').hidden=true;setBusy(false);$('#connection').open=true;status('Disconnected. Your draft stays on this device.');});
  $('#publish').addEventListener('click',async()=>{
    if(!client||busy)return; setBusy(true);
    try{validateMenu(menu);const snapshot=structuredClone(menu),sentRevision=revision; await client.save(snapshot);publishedRevision=sentRevision; $('#dirty').textContent=revision===sentRevision?'Published to GitHub':'Newer edits are saved as a draft';status('Saved to GitHub. The guest menu will update after GitHub Pages finishes publishing, usually within a few minutes.');}
    catch(error){status(error.message,true);}finally{setBusy(false);}
  });
  $('#print').addEventListener('click',()=>window.print());
  window.addEventListener('beforeunload',event=>{if(busy){event.preventDefault();event.returnValue='';}});
}
