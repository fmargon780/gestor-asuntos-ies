import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1600,height:950}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('http://localhost:8124/?demo=1&auto=1'); await p.waitForTimeout(2500);
await p.screenshot({path:'/tmp/revisor/home.png'});
console.log((await p.innerText('body')).slice(0,1500));
console.log(await p.$$eval('nav a, nav button, header button, [role=tab]',e=>e.map(x=>x.innerText.trim()).filter(Boolean).join(' | ')));
console.log(errs);
await b.close();
