async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/v1/forecasting/team/board', {
      headers: { 'x-tenant-id': '00000000-0000-0000-0000-000000000001' }
    });
    if (!res.ok) {
      console.error('Failed to fetch:', res.status, res.statusText);
      process.exit(1);
    }
    const data = await res.json();
    console.log("Team Data:");
    console.log(JSON.stringify(data.team, null, 2));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
test();
