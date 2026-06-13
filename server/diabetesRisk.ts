// server/diabetesRisk.ts

export interface DiabetesAnswers {
  age: number;                // years
  gender: 'male' | 'female';
  familyHistory: boolean;     // parent or sibling with diabetes
  hypertension: boolean;      // has high blood pressure
  physicalActivity: boolean;  // at least 30 min/day
  height: number;             // cm
  weight: number;             // kg
}

export interface RiskResult {
  score: number;
  category: 'low' | 'moderate' | 'high';
  recommendation: string;
}

// Questions in order with validation
export const questions = [
  {
    key: 'age',
    text: 'What is your age? (in years)',
    type: 'number',
    validate: (val: any) => !isNaN(parseFloat(val)) && parseFloat(val) > 0
  },
  {
    key: 'gender',
    text: 'What is your gender? (male/female)',
    type: 'string',
    options: ['male', 'female'],
    validate: (val: any) => ['male', 'female'].includes(val.toLowerCase())
  },
  {
    key: 'familyHistory',
    text: 'Do you have a parent or sibling with diabetes? (yes/no)',
    type: 'boolean',
    validate: (val: any) => ['yes', 'no'].includes(val.toLowerCase())
  },
  {
    key: 'hypertension',
    text: 'Have you ever been told you have high blood pressure? (yes/no)',
    type: 'boolean',
    validate: (val: any) => ['yes', 'no'].includes(val.toLowerCase())
  },
  {
    key: 'physicalActivity',
    text: 'Do you engage in physical activity for at least 30 minutes a day? (yes/no)',
    type: 'boolean',
    validate: (val: any) => ['yes', 'no'].includes(val.toLowerCase())
  },
  {
    key: 'height',
    text: 'What is your height in centimeters? (e.g., 170)',
    type: 'number',
    validate: (val: any) => !isNaN(parseFloat(val)) && parseFloat(val) > 50 && parseFloat(val) < 250
  },
  {
    key: 'weight',
    text: 'What is your weight in kilograms? (e.g., 70)',
    type: 'number',
    validate: (val: any) => !isNaN(parseFloat(val)) && parseFloat(val) > 20 && parseFloat(val) < 300
  },
];

// ADA risk scoring (simplified)
export function calculateRisk(answers: DiabetesAnswers): RiskResult {
  let score = 0;

  // Age
  if (answers.age < 40) score += 0;
  else if (answers.age < 50) score += 1;
  else if (answers.age < 60) score += 2;
  else score += 3;

  // Family history
  if (answers.familyHistory) score += 1;

  // Hypertension
  if (answers.hypertension) score += 1;

  // Physical inactivity
  if (!answers.physicalActivity) score += 1;

  // BMI
  const bmi = answers.weight / ((answers.height / 100) ** 2);
  if (bmi < 25) score += 0;
  else if (bmi < 30) score += 1;
  else if (bmi < 40) score += 2;
  else score += 3;

  let category: 'low' | 'moderate' | 'high';
  if (score <= 2) category = 'low';
  else if (score <= 4) category = 'moderate';
  else category = 'high';

  let recommendation = '';
  if (category === 'low') {
    recommendation = 'Your risk appears low. Maintain a healthy lifestyle and check with your doctor periodically.';
  } else if (category === 'moderate') {
    recommendation = 'You may be at moderate risk. Consider consulting a healthcare provider for a check-up and possible blood sugar testing.';
  } else {
    recommendation = 'Your risk is high. Please see a doctor for proper evaluation. Early detection is important.';
  }

  return { score, category, recommendation };
}

// ---------- Session Management (keyed by conversationId) ----------
interface Session {
  conversationId: string;
  step: number;               // index of next question (0..questions.length)
  answers: Partial<DiabetesAnswers>;
  lastActivity: Date;
}

const sessions = new Map<string, Session>(); // key = conversationId
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function getOrCreateSession(conversationId: string): Session {
  let session = sessions.get(conversationId);
  const now = new Date();
  if (!session || (now.getTime() - session.lastActivity.getTime() > SESSION_TIMEOUT)) {
    session = { conversationId, step: 0, answers: {}, lastActivity: now };
    sessions.set(conversationId, session);
  }
  return session;
}

export function updateSession(conversationId: string, answer: any) {
  const session = sessions.get(conversationId);
  if (!session || session.step === 0) return;

  const question = questions[session.step - 1];
  if (question) {
    let value: any = answer;
    if (question.type === 'number') value = parseFloat(answer);
    else if (question.type === 'boolean') value = answer.toLowerCase() === 'yes';
    else if (question.type === 'string' && question.options) {
      value = answer.toLowerCase();
    }
    session.answers[question.key as keyof DiabetesAnswers] = value;
  }
  session.lastActivity = new Date();
  sessions.set(conversationId, session);
}

export function advanceSession(conversationId: string) {
  const session = sessions.get(conversationId);
  if (session) {
    session.step++;
    session.lastActivity = new Date();
  }
}

export function isSessionComplete(conversationId: string): boolean {
  const session = sessions.get(conversationId);
  return session ? session.step >= questions.length : false;
}

export function getCurrentQuestion(conversationId: string): string | null {
  const session = sessions.get(conversationId);
  if (!session || session.step >= questions.length) return null;
  return questions[session.step].text;
}

export function getAnswers(conversationId: string): DiabetesAnswers | null {
  const session = sessions.get(conversationId);
  if (!session || session.step < questions.length) return null;
  const answers = session.answers as DiabetesAnswers;
  if (answers.age && answers.gender && answers.familyHistory !== undefined &&
      answers.hypertension !== undefined && answers.physicalActivity !== undefined &&
      answers.height && answers.weight) {
    return answers;
  }
  return null;
}

export function clearSession(conversationId: string) {
  sessions.delete(conversationId);
}