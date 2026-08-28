type AuthConfig={googleConfigured:boolean};
type AuthMe={provider:string};
let state:{configured:boolean;provider:string}|null=null;
async function load(){try{const [c,m]=await Promise.all([fetch('/api/auth/config').then(r=>r.json() as Promise<AuthConfig>),fetch('/api/auth/me').then(r=>r.json() as Promise<AuthMe>)]);state={configured:c.googleConfigured,provider:m.provider};decorate()}catch{}}
function decorate(){const host=document.querySelector<HTMLElement>('.cf-user');if(!host||!state)return;host.querySelector('.cf-google')?.remove();if(state.provider==='guest'&&state.configured){const a=document.createElement('a');a.className='cf-google';a.href='/auth/google';a.textContent='G';a.title='Google cloud save';a.style.cssText='display:grid;place-items:center;width:28px;height:28px;margin-left:6px;border:1px solid rgba(104,228,255,.28);border-radius:7px;color:#eafaff;text-decoration:none;background:rgba(35,130,175,.12);font-weight:900';host.append(a)}}
new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true});void load();
