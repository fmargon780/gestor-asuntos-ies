import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1600,height:950}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('http://localhost:8124/?demo=1&auto=1'); await p.waitForTimeout(2000);
await p.getByText('Ajustes',{exact:true}).first().click(); await p.waitForTimeout(1000);
await p.screenshot({path:'/tmp/revisor/ajustes.png'});
console.log((await p.innerText('body')).slice(0,2500));
console.log(errs);
await b.close();
