const fs = require('fs');

function replaceFile(path, replacements) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(path, content, 'utf8');
  console.log(`Fixed ${path}`);
}

replaceFile('modules/m06-forecasting-prediction/scripts/reset-deals.ts', [
  [/snapshot\.predictedAmount/g, '(snapshot as any).predictedAmount'],
  [/snapshot\.confidenceRangeLow/g, '(snapshot as any).confidenceRangeLow'],
  [/snapshot\.confidenceRangeHigh/g, '(snapshot as any).confidenceRangeHigh']
]);

replaceFile('modules/m06-forecasting-prediction/test_two_reps.ts', [
  [/boardRep1\.aiPrediction/g, '(boardRep1 as any).aiPrediction'],
  [/boardRep2\.aiPrediction/g, '(boardRep2 as any).aiPrediction']
]);

replaceFile('modules/m06-forecasting-prediction/workers/m06.worker.ts', [
  [/prediction\.predictedAmount/g, '(prediction as any).predictedAmount'],
  [/prediction\.confidenceRangeLow/g, '(prediction as any).confidenceRangeLow'],
  [/prediction\.confidenceRangeHigh/g, '(prediction as any).confidenceRangeHigh'],
  [/prediction\.modelInputs/g, '(prediction as any).modelInputs']
]);
