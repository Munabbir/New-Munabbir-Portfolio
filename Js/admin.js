const $=id=>document.getElementById(id);
let client=null,session=null,currentImageUrl=null;
function notice(msg,bad=false){$('notice').textContent=msg;$('notice').classList.remove('hidden');$('notice').className='mt-6 rounded-xl border p-4 text-sm '+(bad?'border-red-400/30 bg-red-400/10 text-red-200':'border-emerald-300/20 bg-emerald-300/10 text-emerald-100')}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function resetForm(){$('projectForm').reset();$('projectId').value='';$('published').checked=true;$('formTitle').textContent='Add a project';$('saveButton').textContent='Save project';$('cancelEdit').classList.add('hidden');$('imagePreview').classList.add('hidden');$('imagePreview').src='';currentImageUrl=null}
function showSignedIn(){ $('setupWarning').classList.add('hidden');$('authPanel').classList.add('hidden');$('manager').classList.remove('hidden');$('signOut').classList.remove('hidden');loadProjects()}
async function init(){
 const cfg=window.PORTFOLIO_CONFIG||{};
 if(!cfg.supabaseUrl||!cfg.supabaseAnonKey){$('authPanel').classList.add('hidden');$('setupWarning').classList.remove('hidden');
 return}
 $('setupWarning').classList.add('hidden');client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);$('authPanel').classList.remove('hidden');
 const {data:{session:s}}=await client.auth.getSession();session=s;
 if(session)showSignedIn();
 client.auth.onAuthStateChange((_event,s)=>{session=s;if(s)showSignedIn();
  else{$('manager').classList.add('hidden');$('signOut').classList.add('hidden');$('authPanel').classList.remove('hidden')}});
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();
  const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)notice(error.message,true);else notice('Signed in successfully.')});
$('signOut').addEventListener('click',async()=>{await client.auth.signOut();notice('You are signed out.')});
$('refresh').addEventListener('click',loadProjects);
$('cancelEdit').addEventListener('click',resetForm);
$('image').addEventListener('change',()=>{const f=$('image').files[0];if(!f){$('imagePreview').classList.add('hidden');return}if(f.size>4*1024*1024){notice('Image must be 4 MB or smaller.',true);$('image').value='';return}const url=URL.createObjectURL(f);$('imagePreview').src=url;$('imagePreview').classList.remove('hidden')});
async function loadProjects(){if(!client||!session)return;
  const box=$('projectList');box.innerHTML='<p class="text-sm text-slate-400">Loading…</p>';
  const {data,error}=await client.from('projects').select('*').order('created_at',{ascending:false});
  if(error){box.innerHTML='';notice(error.message,true);return}if(!data.length){box.innerHTML='<p class="text-sm text-slate-400">No projects yet. Add your first project using the form.</p>';return}
 box.innerHTML=data.map(p=>`<article class="rounded-xl border border-white/10 p-4"><div class="flex gap-3">${p.image_url?`<img src="${esc(p.image_url)}" class="h-16 w-20 rounded-lg object-cover" alt="">`:`<div class="grid h-16 w-20 place-items-center rounded-lg bg-slate-800 neon"><i class="fa-solid fa-code"></i></div>`}<div class="min-w-0 flex-1"><h3 class="font-semibold">${esc(p.title)}</h3><p class="mt-1 text-xs text-slate-400">${p.published?'Published':'Draft'} · ${esc((p.description||'').slice(0,100))}</p></div></div><div class="mt-4 flex gap-4 text-sm"><button class="neon" data-edit="${p.id}">Edit</button><button class="text-red-300" data-delete="${p.id}">Delete</button></div></article>`).join('');
 box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editProject(data.find(p=>p.id===b.dataset.edit)));
 box.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProject(b.dataset.delete));
}
function editProject(p){$('projectId').value=p.id;$('title').value=p.title;$('description').value=p.description;$('liveUrl').value=p.live_url||'';$('githubUrl').value=p.github_url||'';$('published').checked=!!p.published;currentImageUrl=p.image_url||null;if(currentImageUrl){$('imagePreview').src=currentImageUrl;$('imagePreview').classList.remove('hidden')}else $('imagePreview').classList.add('hidden');$('formTitle').textContent='Edit project';$('saveButton').textContent='Update project';$('cancelEdit').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})}
async function uploadImage(file){if(!file)return currentImageUrl;if(file.size>4*1024*1024)throw new Error('Image must be 4 MB or smaller.');if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw new Error('Please choose a JPG, PNG, WebP or GIF image.');const ext=file.name.split('.').pop().toLowerCase();const name=`${session.user.id}/${crypto.randomUUID()}.${ext}`;const {error}=await client.storage.from('project-images').upload(name,file,{upsert:false,contentType:file.type});if(error)throw error;return client.storage.from('project-images').getPublicUrl(name).data.publicUrl}
$('projectForm').addEventListener('submit',async e=>{e.preventDefault();if(!session){notice('Please sign in first.',true);return}const file=$('image').files[0];$('saveButton').disabled=true;$('saveButton').textContent='Saving…';try{const image_url=await uploadImage(file);const payload={title:$('title').value.trim(),description:$('description').value.trim(),image_url,live_url:$('liveUrl').value.trim()||null,github_url:$('githubUrl').value.trim()||null,published:$('published').checked,updated_at:new Date().toISOString()};const id=$('projectId').value;const result=id?await client.from('projects').update(payload).eq('id',id):await client.from('projects').insert(payload);if(result.error)throw result.error;notice(id?'Project updated.':'Project added.');resetForm();await loadProjects()}catch(err){notice(err.message||'Could not save project.',true)}finally{$('saveButton').disabled=false;$('saveButton').textContent=$('projectId').value?'Update project':'Save project'}});
async function deleteProject(id){if(!confirm('Delete this project permanently?'))return;
const {error}=await client.from('projects').delete().eq('id',id);if(error)notice(error.message,true);else{notice('Project deleted.');loadProjects()}}
init();