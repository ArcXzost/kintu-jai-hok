export interface DailyAssessment {
  date: string;
  morningAssessment?: {
    sleepQuality: number;
    energyWaking: number;
    mentalClarity: number;
    physicalReadiness: number;
    motivation: number;
    exerciseReadinessScore: number;
  };
  exerciseSession?: {
    exerciseType?: {
      id: string;
      name: string;
      category: string;
    };
    preExercise?: {
      time: string;
      lastMeal: number;
      hydration: number;
      baselineRPE: number;
    };
    duringExercise?: Array<{
      time: string;
      rpe: number;
      talkTest: boolean;
      symptoms: string[];
    }>;
    postExercise?: {
      immediateRPE: number;
      recovery30min?: number;
      recovery2hr?: number;
      satisfaction: number;
    };
  };
  dailyNotes?: string;
  symptoms?: string[];
  medicalData?: {
    hemoglobin?: number;
    hematocrit?: number;
    bloodPressureSys?: number;
    bloodPressureDia?: number;
    date: string;
  };
}

export interface FatigueScale {
  id: string;
  date: string;
  type: 'FSS' | 'FACIT-F';
  scores: number[];
  totalScore: number;
  interpretation: string;
}

export class HealthStorage {
  private static DAILY_KEY = 'thal_daily_assessments';
  private static SCALES_KEY = 'thal_fatigue_scales';

  static getDailyAssessments(): DailyAssessment[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.DAILY_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveDailyAssessment(assessment: DailyAssessment): void {
    if (typeof window === 'undefined') return;
    const assessments = this.getDailyAssessments();
    const existingIndex = assessments.findIndex(a => a.date === assessment.date);
    
    if (existingIndex >= 0) {
      assessments[existingIndex] = { ...assessments[existingIndex], ...assessment };
    } else {
      assessments.push(assessment);
    }
    
    localStorage.setItem(this.DAILY_KEY, JSON.stringify(assessments));
  }

  static getDailyAssessment(date: string): DailyAssessment | null {
    const assessments = this.getDailyAssessments();
    return assessments.find(a => a.date === date) || null;
  }

  static getFatigueScales(): FatigueScale[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.SCALES_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveFatigueScale(scale: FatigueScale): void {
    if (typeof window === 'undefined') return;
    const scales = this.getFatigueScales();
    const existingIndex = scales.findIndex(s => s.id === scale.id);
    
    if (existingIndex >= 0) {
      scales[existingIndex] = scale;
    } else {
      scales.push(scale);
    }
    
    localStorage.setItem(this.SCALES_KEY, JSON.stringify(scales));
  }

  static exportData(): string {
    return JSON.stringify({
      dailyAssessments: this.getDailyAssessments(),
      fatigueScales: this.getFatigueScales(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.dailyAssessments) {
        localStorage.setItem(this.DAILY_KEY, JSON.stringify(data.dailyAssessments));
      }
      if (data.fatigueScales) {
        localStorage.setItem(this.SCALES_KEY, JSON.stringify(data.fatigueScales));
      }
      return true;
    } catch {
      return false;
    }
  }
}