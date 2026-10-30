document.getElementById('year').textContent=new Date().getFullYear();
    const phrases=['Frontend Developer','Tailwind CSS Enthusiast','Responsive Web Designer','Always Learning'];
    let pi=0,ci=0,del=false;
    function type(){const el=document.getElementById('typing'),s=phrases[pi];
        el.textContent=s.slice(0,ci);if(!del&&ci<s.length){ci++;setTimeout(type,85)}else if(!del){del=true;setTimeout(type,1000)}else if(ci>0){ci--;setTimeout(type,40)}else{del=false;pi=(pi+1)%phrases.length;setTimeout(type,250)}}type();
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    async function loadProjects(){
      const grid=document.getElementById('projectGrid'),note=document.getElementById('projectNote');
      if(!window.PORTFOLIO_CONFIG?.supabaseUrl||!window.PORTFOLIO_CONFIG?.supabaseAnonKey){grid.innerHTML='<div class="glass rounded-2xl p-6 text-slate-300">Your projects will appear here after you connect Supabase. Follow README.txt to finish setup.</div>';return}
      try{
        const client=window.supabase.createClient(PORTFOLIO_CONFIG.supabaseUrl,PORTFOLIO_CONFIG.supabaseAnonKey);
        const {data,error}=await client.from('projects').select('id,title,description,image_url,live_url,github_url,created_at').eq('published',true).order('created_at',{ascending:false});
        if(error)throw error;
        if(!data?.length){grid.innerHTML='<div class="glass rounded-2xl p-6 text-slate-400">No projects published yet. Add one from the Admin page.</div>';return}
        grid.innerHTML=data.map(p=>`<article class="glass overflow-hidden rounded-2xl transition hover:-translate-y-1">${p.image_url?`<img class="project-img w-full" src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy">`:`<div class="project-img grid place-items-center text-4xl neon"><i class="fa-solid fa-laptop-code"></i></div>`}<div class="p-5"><h3 class="text-lg font-bold">${esc(p.title)}</h3><p class="mt-2 min-h-12 text-sm leading-6 text-slate-400">${esc(p.description)}</p><div class="mt-5 flex flex-wrap gap-3">${p.live_url?`<a class="text-sm neon" href="${esc(p.live_url)}" target="_blank" rel="noopener">Live Demo ↗</a>`:''}${p.github_url?`<a class="text-sm text-slate-300" href="${esc(p.github_url)}" target="_blank" rel="noopener">GitHub ↗</a>`:''}</div></div></article>`).join('');
      }catch(e){grid.innerHTML='<div class="glass rounded-2xl p-6 text-slate-400">Could not load projects yet. Check your Supabase setup and internet connection.</div>';note.textContent='Setup detail: '+e.message}
    }loadProjects();