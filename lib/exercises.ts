export interface ExerciseType {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'flexibility';
  intensity: 'light' | 'moderate' | 'vigorous';
  duration: string;
  equipment: string[];
  description: string;
  instructions: string[];
  modifications: string[];
  thalassemiaConsiderations: string[];
  targetRPE: number[];
  contraindications: string[];
  videoUrl?: string;
  videoTitle?: string;
}

export const exerciseLibrary: ExerciseType[] = [
  // HOME CARDIO EXERCISES
  {
    id: 'walking-in-place',
    name: 'Walking in Place',
    category: 'cardio',
    intensity: 'light',
    duration: '8-20 minutes',
    equipment: ['none'],
    description: 'Foundation cardio exercise perfect for beginners to build endurance at home.',
    instructions: [
      'Stand with feet hip-width apart',
      'Start with gentle marching, lifting knees slightly',
      'Swing arms naturally at your sides',
      'Maintain steady rhythm - should be able to hold conversation',
      'Gradually increase knee lift height as comfortable',
      'Focus on landing softly on feet'
    ],
    modifications: [
      'Hold onto chair or wall for balance',
      'Start with just 2-3 minutes',
      'Keep knees lower if needed',
      'Sit and do arm movements only if standing is difficult'
    ],
    thalassemiaConsiderations: [
      'Perfect starting exercise for building stamina',
      'Monitor for unusual breathlessness',
      'Stop if you feel dizzy or lightheaded',
      'Great for days when outdoor exercise isn\'t possible'
    ],
    targetRPE: [2, 3, 4],
    contraindications: [
      'Severe anemia (Hb < 8 g/dL)',
      'Recent blood transfusion (within 24 hours)',
      'Acute dizziness or balance problems',
      'Severe joint pain in legs'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=u08lo0bESJc',
    videoTitle: '5-Minute Walking in Place for Beginners'
  },
  {
    id: 'step-touches',
    name: 'Step-Touches with Arms',
    category: 'cardio',
    intensity: 'light',
    duration: '6-15 minutes',
    equipment: ['none'],
    description: 'Side-to-side movement that adds gentle cardio while improving coordination.',
    instructions: [
      'Step right foot to the side, bring left foot to meet it',
      'Step left foot to the side, bring right foot to meet it',
      'Add arm raises overhead as you step',
      'Keep movements smooth and controlled',
      'Maintain upright posture throughout',
      'Continue for set time period'
    ],
    modifications: [
      'Do smaller steps if space is limited',
      'Keep arms at shoulder height instead of overhead',
      'Hold onto chair and just do the stepping',
      'Reduce arm movements if tiring'
    ],
    thalassemiaConsiderations: [
      'Excellent for improving circulation',
      'Low impact on joints',
      'Easy to modify intensity level',
      'Can be done in small spaces'
    ],
    targetRPE: [2, 3, 4],
    contraindications: [
      'Severe anemia',
      'Balance disorders',
      'Acute illness',
      'Severe shoulder problems (for arm movements)'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=GSZ7XWcId5Q',
    videoTitle: 'Low Impact Step Touch Cardio'
  },
  {
    id: 'modified-jumping-jacks',
    name: 'Modified Jumping Jacks (Step-Out)',
    category: 'cardio',
    intensity: 'light',
    duration: '5-12 minutes',
    equipment: ['none'],
    description: 'Low-impact version of jumping jacks that reduces stress on joints while providing cardio benefits.',
    instructions: [
      'Start with feet together, arms at sides',
      'Step right foot out to side while raising arms overhead',
      'Step right foot back to center while lowering arms',
      'Repeat with left foot',
      'Continue alternating sides',
      'Keep movements controlled and rhythmic'
    ],
    modifications: [
      'Just do the arm movements while standing still',
      'Only raise arms to shoulder height',
      'Hold onto chair and just do leg movements',
      'Do seated version with just arm movements'
    ],
    thalassemiaConsiderations: [
      'No jumping reduces impact stress',
      'Good for heart rate elevation without overexertion',
      'Can easily adjust intensity by changing speed',
      'Stop if breathing becomes labored'
    ],
    targetRPE: [3, 4, 5],
    contraindications: [
      'Severe anemia',
      'Recent cardiac symptoms',
      'Severe fatigue',
      'Balance problems'
    ],
    videoUrl: 'https://www.youtube.com/shorts/FJ-seqGfwzA',
    videoTitle: 'Low Impact Jumping Jacks - Step Out Version'
  },

  // HOME STRENGTH EXERCISES
  {
    id: 'wall-pushups',
    name: 'Wall Push-Ups',
    category: 'strength',
    intensity: 'light',
    duration: '8-15 minutes',
    equipment: ['wall'],
    description: 'Gentle upper body strengthening exercise perfect for beginners.',
    instructions: [
      'Stand arm\'s length from a wall',
      'Place palms flat against wall at shoulder height',
      'Keep body straight, lean into wall',
      'Push back to starting position',
      'Start with 5-10 repetitions',
      'Rest 30 seconds between sets'
    ],
    modifications: [
      'Stand closer to wall for easier version',
      'Do fewer repetitions (3-5 to start)',
      'Take longer breaks between sets',
      'Use a sturdy table instead of wall if needed'
    ],
    thalassemiaConsiderations: [
      'Builds upper body strength gradually',
      'No lying down required',
      'Easy to control intensity',
      'Good for improving functional strength'
    ],
    targetRPE: [3, 4, 5],
    contraindications: [
      'Severe anemia',
      'Acute shoulder or wrist pain',
      'Recent injury to arms or shoulders',
      'Severe weakness'
    ],
    videoUrl: 'https://www.youtube.com/shorts/YWw-3rGaoT0',
    videoTitle: 'Wall Push-Ups for Beginners - Proper Form'
  },
  {
    id: 'chair-squats',
    name: 'Chair-Assisted Squats',
    category: 'strength',
    intensity: 'light',
    duration: '8-15 minutes',
    equipment: ['sturdy chair'],
    description: 'Functional leg strengthening using a chair for support and guidance.',
    instructions: [
      'Stand in front of sturdy chair',
      'Slowly lower yourself until you lightly touch the chair seat',
      'Immediately stand back up',
      'Keep feet hip-width apart',
      'Use arms for balance if needed',
      'Perform 5-15 repetitions'
    ],
    modifications: [
      'Actually sit down fully and then stand up',
      'Hold onto chair back for extra support',
      'Start with just 3-5 repetitions',
      'Use chair arms to help push up if needed'
    ],
    thalassemiaConsiderations: [
      'Builds leg strength for daily activities',
      'Chair provides safety and confidence',
      'Improves balance and coordination',
      'Easy to progress gradually'
    ],
    targetRPE: [3, 4, 5],
    contraindications: [
      'Severe anemia',
      'Acute knee or hip pain',
      'Recent leg injury',
      'Severe balance problems'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=4k1SPQ9tEMg',
    videoTitle: 'Chair Squats for Seniors - Safe Technique'
  },
  {
    id: 'standing-knee-lifts',
    name: 'Standing Knee Lifts',
    category: 'strength',
    intensity: 'light',
    duration: '6-12 minutes',
    equipment: ['chair (optional)'],
    description: 'Core and leg strengthening exercise that improves balance and coordination.',
    instructions: [
      'Stand with feet hip-width apart',
      'Hold onto chair or wall for balance if needed',
      'Slowly lift right knee toward chest',
      'Hold for 2-3 seconds',
      'Lower slowly and repeat with left knee',
      'Alternate legs for desired duration'
    ],
    modifications: [
      'Don\'t lift knee as high',
      'Hold onto sturdy support throughout',
      'Do exercise while seated (seated marching)',
      'Take breaks between each lift if needed'
    ],
    thalassemiaConsiderations: [
      'Improves core strength safely',
      'Good for balance training',
      'Can be adjusted for energy levels',
      'Helps with functional mobility'
    ],
    targetRPE: [2, 3, 4],
    contraindications: [
      'Severe balance problems',
      'Acute hip or knee pain',
      'Recent falls',
      'Severe weakness'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=O_8EUJ7i-PI',
    videoTitle: 'Standing Knee Lifts Exercise - Balance Training'
  },

  // FLEXIBILITY & GENTLE MOVEMENT
  {
    id: 'gentle-stretching',
    name: 'Gentle Full-Body Stretching',
    category: 'flexibility',
    intensity: 'light',
    duration: '12-25 minutes',
    equipment: ['chair (optional)', 'yoga mat (optional)'],
    description: 'Comprehensive stretching routine to improve flexibility and reduce tension.',
    instructions: [
      'Start with gentle neck rolls (30 seconds each direction)',
      'Do shoulder rolls forward and backward (30 seconds each)',
      'Gentle arm circles (30 seconds each direction)',
      'Seated or standing calf stretches (30 seconds each leg)',
      'Gentle hamstring stretches (30 seconds each leg)',
      'Finish with deep breathing (2-3 minutes)'
    ],
    modifications: [
      'Perform all stretches while seated',
      'Hold stretches for shorter periods (10-15 seconds)',
      'Skip any stretch that causes discomfort',
      'Use wall or chair for support during standing stretches'
    ],
    thalassemiaConsiderations: [
      'Perfect for low-energy days',
      'Helps reduce muscle tension and stress',
      'Improves circulation gently',
      'Can be done anytime, anywhere'
    ],
    targetRPE: [1, 2, 3],
    contraindications: [
      'Acute muscle strain',
      'Recent injury',
      'Severe joint pain',
      'Acute illness'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=CY6QP4ofwx4',
    videoTitle: 'Gentle Stretching for Seniors - Full Body'
  },
  {
    id: 'seated-exercises',
    name: 'Seated Exercise Routine',
    category: 'flexibility',
    intensity: 'light',
    duration: '15-30 minutes',
    equipment: ['sturdy chair'],
    description: 'Complete workout that can be done entirely while seated - perfect for low-energy days.',
    instructions: [
      'Seated marching - lift knees alternately (2 minutes)',
      'Arm circles - both directions (1 minute)',
      'Shoulder shrugs and rolls (1 minute)',
      'Seated twists - rotate torso left and right (1 minute)',
      'Ankle pumps and circles (1 minute)',
      'Seated calf raises (1 minute)'
    ],
    modifications: [
      'Use chair with arms for extra support',
      'Reduce duration of each exercise',
      'Take breaks between exercises',
      'Focus on upper body only if legs are tired'
    ],
    thalassemiaConsiderations: [
      'Ideal for days when standing is difficult',
      'Maintains circulation and movement',
      'Very low energy requirement',
      'Can be done while watching TV or listening to music'
    ],
    targetRPE: [1, 2, 3],
    contraindications: [
      'Unable to sit upright comfortably',
      'Severe back pain',
      'Acute illness',
      'Severe shoulder problems'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=E00Utc1QQqA',
    videoTitle: 'Chair Exercises for Seniors - Complete Routine'
  },
  {
    id: 'breathing-meditation',
    name: 'Breathing & Gentle Movement',
    category: 'flexibility',
    intensity: 'light',
    duration: '8-20 minutes',
    equipment: ['none'],
    description: 'Mindful breathing combined with gentle movements for relaxation and stress relief.',
    instructions: [
      'Find comfortable position (sitting or standing)',
      'Take 5 deep breaths, breathing in through nose, out through mouth',
      'Add gentle arm raises with each inhale',
      'Lower arms with each exhale',
      'Include gentle neck and shoulder movements',
      'End with 2 minutes of quiet breathing'
    ],
    modifications: [
      'Do entirely while seated or lying down',
      'Focus only on breathing if movement is tiring',
      'Use guided meditation app if helpful',
      'Adjust duration based on comfort'
    ],
    thalassemiaConsiderations: [
      'Excellent for stress management',
      'Improves oxygen utilization',
      'Can help with anxiety about symptoms',
      'Perfect for any time of day'
    ],
    targetRPE: [1, 2],
    contraindications: [
      'Severe respiratory problems',
      'Panic disorder (without guidance)',
      'Acute breathing difficulties',
      'Severe anxiety (consult healthcare provider first)'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=iuv5EomIA9s',
    videoTitle: 'Gentle Breathing Exercises for Relaxation'
  },

  // PROGRESSIVE CARDIO
  {
    id: 'dance-movement',
    name: 'Gentle Dance Movement',
    category: 'cardio',
    intensity: 'light',
    duration: '8-25 minutes',
    equipment: ['music (optional)'],
    description: 'Fun, free-form movement to music that improves mood and provides gentle cardio.',
    instructions: [
      'Choose favorite upbeat but not fast-paced music',
      'Start with simple side-to-side swaying',
      'Add arm movements that feel good',
      'Include gentle hip movements',
      'Move to the rhythm at your own pace',
      'Focus on enjoyment rather than specific moves'
    ],
    modifications: [
      'Dance while seated if standing is tiring',
      'Use slower music',
      'Focus only on upper body movements',
      'Take breaks whenever needed'
    ],
    thalassemiaConsiderations: [
      'Boosts mood and mental health',
      'Provides cardio in an enjoyable way',
      'Can be adjusted to energy levels',
      'Social activity if done with others'
    ],
    targetRPE: [2, 3, 4],
    contraindications: [
      'Severe balance problems',
      'Acute dizziness',
      'Severe joint pain',
      'Recent falls'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=9DhwZqNJkIU',
    videoTitle: 'Senior Dance Fitness - Low Impact Fun'
  },
  {
    id: 'interval-walking',
    name: 'Interval Walking in Place',
    category: 'cardio',
    intensity: 'light',
    duration: '12-25 minutes',
    equipment: ['timer (optional)'],
    description: 'Alternating between comfortable and slightly faster paced walking to build endurance.',
    instructions: [
      'Start with 2 minutes of comfortable walking in place',
      'Increase to slightly faster pace for 1 minute',
      'Return to comfortable pace for 2 minutes',
      'Repeat the faster/slower pattern 3-5 times',
      'End with 2 minutes of slow walking',
      'Focus on how you feel rather than strict timing'
    ],
    modifications: [
      'Make intervals shorter (30 seconds fast, 90 seconds slow)',
      'Reduce the "fast" pace to just slightly quicker',
      'Take seated breaks if needed',
      'Adjust timing based on energy levels'
    ],
    thalassemiaConsiderations: [
      'Builds cardiovascular fitness gradually',
      'Teaches body awareness of exertion levels',
      'Can be adjusted day by day',
      'Good preparation for outdoor walking'
    ],
    targetRPE: [2, 3, 4, 5],
    contraindications: [
      'Severe anemia',
      'Uncontrolled heart conditions',
      'Severe fatigue',
      'Recent illness'
    ],
    videoUrl: 'https://www.youtube.com/shorts/kN_7FoYAoXM',
    videoTitle: 'Interval Walking in Place - Beginner Cardio'
  }
];

export const getExercisesByCategory = (category: string) => {
  return exerciseLibrary.filter(exercise => exercise.category === category);
};

export const getExercisesByIntensity = (intensity: string) => {
  return exerciseLibrary.filter(exercise => exercise.intensity === intensity);
};

export const getExerciseById = (id: string) => {
  return exerciseLibrary.find(exercise => exercise.id === id);
};
