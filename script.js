const $ = id => document.getElementById(id);
const log = msg => { const p = $("log"); p.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2); };
const base = () => $("baseUrl").value.replace(/\/$/, '');

async function api(path, options = {}) {
      const url = base() + path;
      try {
            const res = await fetch(url, options);
            const contentType = res.headers.get('content-type') || '';
            let data = null;
            if (contentType.includes('application/json')) data = await res.json();
            else data = await res.text();
            if (!res.ok) throw { status: res.status, data };
            return data;
      } catch (e) {
            log(e.data || e.message || e);
            throw e;
      }
}

async function createCategory() {
      const raw = $("catName").value;
      let payload;
      try { payload = JSON.parse(raw); } catch { alert('Invalid JSON for name'); return; }
      const data = await api('/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: payload }) });
      log(data);
      await listCategories();
}
async function listCategories() {
      const data = await api('/categories');
      const ul = $('catsList'); ul.innerHTML = '';
      data.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="row"><img class="preview" src="${base().replace('/api/v1', '')}${c.image || ''}" onerror="this.style.display='none'"> <div><strong>${c.id}</strong><div class="meta">${JSON.stringify(c.name)}</div></div></div>`;
            const actions = document.createElement('div'); actions.className = 'actions';
            const upd = document.createElement('button'); upd.textContent = 'Upd'; upd.onclick = async () => {
                  const newName = prompt('New name JSON', JSON.stringify(c.name));
                  try { const parsed = JSON.parse(newName); await api(`/categories/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: parsed }) }); await listCategories(); } catch (e) { alert('error') }
            };
            const del = document.createElement('button'); del.textContent = 'Del'; del.onclick = async () => { if (!confirm('Delete?')) return; await api(`/categories/${c.id}`, { method: 'DELETE' }); await listCategories(); };
            actions.appendChild(upd); actions.appendChild(del); li.appendChild(actions); ul.appendChild(li);
      });
      log(data);
}

async function createArtist() {
  const nameRaw = $("artistName").value;
  const slug = $("artistSlug").value;
  const descRaw = $("artistDesc").value;
  const file = $("artistPhoto").files[0];
  const categoryId = $("categoryId")?.value;

  let name, desc;
  try {
    name = JSON.parse(nameRaw);
    desc = descRaw ? JSON.parse(descRaw) : undefined;
  } catch {
    alert("Invalid JSON in name/description");
    return;
  }

  const fd = new FormData();
  fd.append("name", JSON.stringify(name));
  if (slug) fd.append("slug", slug);
  if (desc) fd.append("description", JSON.stringify(desc));
  if (file) fd.append("photo", file);
  if (categoryId) fd.append("categoryId", categoryId); 

  const data = await fetch(base() + "/artists", {
    method: "POST",
    body: fd,
  }).then((r) => r.json());

  log(data);
  await listArtists();
}

async function listArtists() {
      const data = await api('/artists'); const ul = $('artistsList'); ul.innerHTML = '';
      data.forEach(a => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="row"><img class="preview" src="${base().replace('/api/v1', '')}${a.photo || ''}" onerror="this.style.display='none'"> <div><strong>${a.id}</strong><div class="meta">${JSON.stringify(a.name)}</div></div></div>`;
            const actions = document.createElement('div'); actions.className = 'actions';
            const del = document.createElement('button'); del.textContent = 'Del'; del.onclick = async () => { if (!confirm('Delete artist?')) return; await api(`/artists/${a.id}`, { method: 'DELETE' }); await listArtists(); };
            const upd = document.createElement('button'); upd.textContent = 'Upd'; upd.onclick = async () => { const newName = prompt('New name JSON', JSON.stringify(a.name)); try { const parsed = JSON.parse(newName); await api(`/artists/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: parsed }) }); await listArtists(); } catch (e) { alert('error') } };
            actions.appendChild(upd); actions.appendChild(del); li.appendChild(actions); ul.appendChild(li);
      });
      log(data);
}

async function createLot() {
  const nameRaw = $("lotName").value;
  const artistId = $("lotArtistId").value;
  const price = $("lotPrice").value;
  const file = $("lotPhoto").files[0];
  const categoriesRaw = $("lotCategoryIds").value; // новое поле

  let name;
  try {
    name = JSON.parse(nameRaw);
  } catch {
    alert("Invalid JSON for name");
    return;
  }

  let categoryIds;
  try {
    categoryIds = JSON.parse(categoriesRaw);
    if (!Array.isArray(categoryIds)) throw new Error();
  } catch {
    alert('Invalid JSON for categoryIds (example: ["uuid1","uuid2"])');
    return;
  }

  const fd = new FormData();
  fd.append("name", JSON.stringify(name));
  if (artistId) fd.append("artistId", artistId);
  if (price) fd.append("price", price);
  if (file) fd.append("photos", file);
  fd.append("categoryIds", JSON.stringify(categoryIds));

  const data = await fetch(base() + "/lots", {
    method: "POST",
    body: fd,
  }).then((r) => r.json());

  log(data);
  await listLots();
}

async function listLots() {
      const data = await api('/lots'); const ul = $('lotsList'); ul.innerHTML = '';
      data.forEach(l => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="row"><img class="preview" src="${base().replace('/api/v1', '')}${(l.photos && l.photos[0]) || ''}" onerror="this.style.display='none'"> <div><strong>${l.id}</strong><div class="meta">${JSON.stringify(l.name)} — ${l.price}</div></div></div>`;
            const actions = document.createElement('div'); actions.className = 'actions';
            const del = document.createElement('button'); del.textContent = 'Del'; del.onclick = async () => { if (!confirm('Delete lot?')) return; await api(`/lots/${l.id}`, { method: 'DELETE' }); await listLots(); };
            const upd = document.createElement('button'); upd.textContent = 'Upd'; upd.onclick = async () => { const newPrice = prompt('New price', l.price); try { await api(`/lots/${l.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: Number(newPrice) }) }); await listLots(); } catch (e) { alert('error') } };
            actions.appendChild(upd); actions.appendChild(del); li.appendChild(actions); ul.appendChild(li);
      });
      log(data);
}

async function createSlider() {
      const order = $("sliderOrder").value; const isActive = $("sliderActive").value; const file = $('sliderImage').files[0]; const link = $('sliderLink').value
      const fd = new FormData(); fd.append('order', order); fd.append('isActive', isActive); if (file) fd.append('image', file); fd.append('link', link)
      const data = await fetch(base() + '/sliders', { method: 'POST', body: fd }).then(r => r.json());
      log(data); await listSliders();
}
async function listSliders() {
      const data = await api('/sliders'); const ul = $('slidersList'); ul.innerHTML = '';
      data.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="row"><img class="preview" src="${base().replace('/api/v1', '')}${s.image || ''}" onerror="this.style.display='none'"> <div><strong>${s.id}</strong><div class="meta">order:${s.order} active:${s.isActive}</div></div></div>`;
            const actions = document.createElement('div'); actions.className = 'actions';
            const del = document.createElement('button'); del.textContent = 'Del'; del.onclick = async () => { if (!confirm('Delete slider?')) return; await api(`/sliders/${s.id}`, { method: 'DELETE' }); await listSliders(); };
            const upd = document.createElement('button'); upd.textContent = 'Upd'; upd.onclick = async () => { const newOrder = prompt('New order', s.order); try { await api(`/sliders/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: Number(newOrder) }) }); await listSliders(); } catch (e) { alert('error') } };
            actions.appendChild(upd); actions.appendChild(del); li.appendChild(actions); ul.appendChild(li);
      });
      log(data);
}

window.addEventListener('load', () => {
      $('createCat').onclick = createCategory; $('refreshCats').onclick = listCategories;
      $('createArtist').onclick = createArtist; $('refreshArtists').onclick = listArtists;
      $('createLot').onclick = createLot; $('refreshLots').onclick = listLots;
      $('createSlider').onclick = createSlider; $('refreshSliders').onclick = listSliders;
      listCategories(); listArtists(); listLots(); listSliders();
});