// 逐題開頁、按到最後一步，截取 .cg 圖（給對圖表用）
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9351;
const OUT = path.join(__dirname, "_figshots");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    "--remote-debugging-port=" + PORT,
    "--user-data-dir=" + path.join(__dirname, "_chrome3"),
    "--window-size=1100,1400",
    "about:blank",
  ], { stdio: "ignore" });

  let targets = null;
  for (let i = 0; i < 40 && !targets; i++) {
    await sleep(250);
    try { targets = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json(); }
    catch (e) { /* not up yet */ }
  }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 0;
  const waiting = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
  };
  const send = (method, params) => new Promise((resolve) => {
    const myId = ++id;
    waiting.set(myId, resolve);
    ws.send(JSON.stringify({ id: myId, method, params: params || {} }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 900, height: 1200, deviceScaleFactor: 2, mobile: false });

  const base = process.argv[2];
  const from = Number(process.argv[3] || 2);
  const to = Number(process.argv[4] || 10);

  for (let p = from; p <= to; p++) {
    await send("Page.navigate", { url: base + "&p=" + p });
    await sleep(1500);
    await send("Runtime.evaluate", {
      expression: `(async()=>{const s=ms=>new Promise(r=>setTimeout(r,ms));
        const b=document.querySelector('.cg-next');
        if(!b) return 'no player';
        for(let i=0;i<12;i++){ if(b.disabled) break; b.click(); await s(700); }
        await s(900); return 'ok';})()`,
      awaitPromise: true,
    });
    await sleep(400);
    const box = await send("Runtime.evaluate", {
      expression: `(() => { const e=document.querySelector('.cg'); if(!e) return null;
        const r=e.getBoundingClientRect(); return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}; })()`,
      returnByValue: true,
    });
    let clip = box.result.result.value;
    if (!clip) { console.log("p" + p + ": no .cg"); continue; }
    const shot = await send("Page.captureScreenshot", {
      format: "png", captureBeyondViewport: true, clip: { ...clip, scale: 1 },
    });
    fs.writeFileSync(path.join(OUT, "p" + p + ".png"), Buffer.from(shot.result.data, "base64"));
    console.log("p" + p + " ok");
  }

  ws.close();
  chrome.kill();
}

main().catch((e) => { console.error(e); process.exit(1); });
