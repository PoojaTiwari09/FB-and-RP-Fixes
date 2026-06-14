async function main() {
  const res = await fetch('http://localhost:3001/api/forecast/submissions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': '33333333-3333-3333-3333-333333333333',
      'x-tenant-id': '00000000-0000-0000-0000-000000000001'
    },
    body: JSON.stringify({
      rep_id: '33333333-3333-3333-3333-333333333333',
      deal_id: '3c43ea78-8e3c-4bdf-b1b9-3fba0df1f471',
      period_id: '00000000-0000-0000-0000-0000000000b2',
      field: 'best_case',
      value: 8000
    })
  });
  console.log(res.status, await res.text());
}
main();
