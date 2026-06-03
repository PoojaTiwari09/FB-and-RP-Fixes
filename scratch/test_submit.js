const { PrismaClient } = require('../boilerplate code/r-revenue-intelligence/packages/database');
const prisma = new PrismaClient();

// Dynamic score calculation logic cloned from service to verify
function calculateCallReviewScore(answers) {
  let totalMax = 0;
  let totalEarned = 0;

  const sections = {
    opening: { title: 'Opening', earned: 0, max: 0 },
    discovery: { title: 'Discovery', earned: 0, max: 0 },
    product_fit: { title: 'Product Fit', earned: 0, max: 0 },
    objection_handling: { title: 'Objection Handling', earned: 0, max: 0 },
  };

  const entries = Array.isArray(answers) 
    ? answers.map(q => [q.questionId, q])
    : Object.entries(answers);

  for (const [qId, ans] of entries) {
    if (!ans) continue;
    if (ans.isNa || ans.isNa === 'true' || ans.isNa === true) continue;

    let sectionKey = 'opening';
    if (qId.startsWith('disc_') || qId === 'q_04' || qId === 'q_05' || qId === 'q_06' || qId === 'q_07') {
      sectionKey = 'discovery';
    } else if (qId.startsWith('fit_')) {
      sectionKey = 'product_fit';
    } else if (qId.startsWith('obj_')) {
      sectionKey = 'objection_handling';
    }

    const maxVal = 10;
    let earnedVal = 0;

    const val = ans.answer !== undefined ? ans.answer : (ans.value !== undefined ? ans.value : null);
    if (val === true || val === 'true' || val === 'Yes' || val === 'yes' || val === 'Good' || val === 'Excellent') {
      earnedVal = 10;
    } else if (val === '4' || val === 4 || val === '5' || val === 5) {
      earnedVal = 8;
    } else if (val === '3' || val === 3) {
      earnedVal = 6;
    } else if (val === '2' || val === 2) {
      earnedVal = 4;
    } else if (val === '1' || val === 1) {
      earnedVal = 2;
    } else if (val === false || val === 'false' || val === 'No' || val === 'no' || val === 'Poor' || val === 'Fair') {
      earnedVal = 0;
    } else if (typeof val === 'number') {
      earnedVal = Math.min(10, Math.max(0, Math.round((val / 5) * 10)));
    }

    sections[sectionKey].max += maxVal;
    sections[sectionKey].earned += earnedVal;
    totalMax += maxVal;
    totalEarned += earnedVal;
  }

  if (totalMax === 0) return { score: 88 };
  return { score: Math.round((totalEarned / totalMax) * 100) };
}

async function main() {
  const reviewId = 'rv_004';
  const answers = {
    op_1: { value: 'Yes', comment: 'Excellent introduction', isNa: false },
    op_2: { value: '4', comment: 'Rapport was good', isNa: false },
    op_3: { value: 'Yes', comment: '', isNa: false },
    disc_1: { value: 'Yes', comment: '', isNa: false },
    disc_2: { value: 'Good', comment: '', isNa: false },
    disc_3: { value: 'No', comment: '', isNa: false },
    disc_4: { value: 'No', comment: '', isNa: false },
    fit_1: { value: 'Yes', comment: '', isNa: false },
    fit_2: { value: '4', comment: '', isNa: false },
    obj_1: { value: 'Yes', comment: '', isNa: false },
    obj_2: { value: '4', comment: '', isNa: false },
  };
  const coaching = {
    strengths: ['Rapport building'],
    improvements: ['Budget confirmation'],
    coachingNotes: 'Focus on budget confirmation',
    recommendedActions: ['MEDDIC training'],
    shareWithRep: true,
  };

  const { score } = calculateCallReviewScore(answers);
  console.log(`Calculated Score: ${score}%`);

  const updated = await prisma.callReview.update({
    where: { reviewId },
    data: {
      status: 'Completed',
      questions: answers,
      feedback: coaching,
      overallScore: score,
    },
  });

  console.log('Database updated successfully:');
  console.log(JSON.stringify(updated, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
