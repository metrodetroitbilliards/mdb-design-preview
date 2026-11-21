import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const require=createRequire(new URL('../../mdb-review-tools/package.json',import.meta.url));const {chromium}=require('playwright');
const origin=process.env.ROSTER_ORIGIN||'http://127.0.0.1:8811',live=!!process.env.ROSTER_ORIGIN;
const catalog=await (await fetch(origin+'/api/top-shooters')).json();assert.ok(Array.isArray(catalog.signups));
for(const row of catalog.signups)assert.deepEqual(Object.keys(row).sort(),['event_id','name','status']);
if(!live)catalog.signups=[{event_id:catalog.events[0].id,name:'Example, Confirmed',status:'confirmed'},{event_id:catalog.events[0].id,name:'Example, Pending',status:'pending'},{event_id:catalog.events[1].id,name:'<img src=x onerror=alert(1)>',status:'waitlisted'}];
const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(!live)await page.route('**/api/top-shooters',r=>r.fulfill({json:catalog}));
await page.goto(origin+'/top-shooter-signup/');await page.locator('.roster-card').first().waitFor();
assert.equal(await page.locator('.roster-card').count(),catalog.events.length);
assert.equal(await page.locator('.roster-card li').count(),catalog.signups.length);
for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}
await page.setViewportSize({width:390,height:844});await page.getByRole('link',{name:/See who/}).click();
await page.locator('#event-rosters').scrollIntoViewIfNeeded();fs.mkdirSync(new URL('../test-results/',import.meta.url),{recursive:true});await page.screenshot({path:new URL('../test-results/public-rosters-'+(live?'live':'local')+'.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
if(!live){assert.equal(await page.locator('.roster-card img').count(),0);assert.match(await page.locator('#roster-list').innerText(),/Pending league review/);assert.match(await page.locator('#roster-list').innerText(),/Waitlisted/);
 catalog.signups.pop();await page.locator('#refresh-rosters').click();await page.waitForFunction(()=>document.querySelectorAll('.roster-card li').length===2);
 await page.unroute('**/api/top-shooters');await page.route('**/api/top-shooters',r=>r.fulfill({status:503,body:'unavailable'}));await page.locator('#refresh-rosters').click();await page.waitForFunction(()=>document.querySelector('#roster-status').textContent.includes('out of date'));assert.equal(await page.locator('.roster-card li').count(),2);
}
assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',live,events:catalog.events.length,signups:catalog.signups.length,widths:[320,390,768,1440],privateFields:false}));await browser.close();
