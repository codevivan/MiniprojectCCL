const target = 'http://16.16.207.70/api/health';
console.log(`Polling CampusBite live EC2 health at: ${target}`);

async function poll() {
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch(target, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        console.log(`\n[SUCCESS ATTEMPT ${attempt}] Live Server Responded HTTP ${res.status}:`);
        console.log(JSON.stringify(data, null, 2));
        return true;
      } else {
        console.log(`[Attempt ${attempt}] HTTP ${res.status}`);
      }
    } catch (err) {
      console.log(`[Attempt ${attempt}] Waiting for Node & Nginx boot-strap... (${err.message})`);
    }
    await new Promise(r => setTimeout(r, 8000));
  }
  console.log('Timeout waiting for live server.');
  return false;
}

poll();
