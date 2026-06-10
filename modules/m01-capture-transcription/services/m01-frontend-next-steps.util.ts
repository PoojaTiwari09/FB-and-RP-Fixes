export type FrontendNextStep = {
  stepId: string;
  description: string;
  completed: boolean;
};

const STEP_PREFIX = 'step_';

export function parseNextSteps(raw: string[] | null | undefined): FrontendNextStep[] {
  if (!raw?.length) return [];

  return raw.map((entry, index) => {
    try {
      const parsed = JSON.parse(entry);
      if (parsed?.id && parsed?.description != null) {
        return {
          stepId: String(parsed.id),
          description: String(parsed.description),
          completed: Boolean(parsed.completed),
        };
      }
    } catch {
      // legacy plain string
    }
    return {
      stepId: `${STEP_PREFIX}${String(index + 1).padStart(3, '0')}`,
      description: entry,
      completed: false,
    };
  });
}

export function serializeNextSteps(steps: FrontendNextStep[]): string[] {
  return steps.map((s) =>
    JSON.stringify({
      id: s.stepId,
      description: s.description,
      completed: s.completed,
    }),
  );
}

export function newStepId(existing: FrontendNextStep[]): string {
  const nums = existing
    .map((s) => {
      const m = /^step_(\d+)$/.exec(s.stepId);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${STEP_PREFIX}${String(next).padStart(3, '0')}`;
}
