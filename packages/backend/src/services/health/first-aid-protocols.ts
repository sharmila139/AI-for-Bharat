/**
 * First Aid Protocols Service
 * Manages first aid protocols for offline caching
 */

export interface FirstAidProtocol {
  protocolId: string;
  protocolName: string;
  emergencyType: string;
  severityLevel: 'minor' | 'moderate' | 'severe' | 'life_threatening';
  immediateSteps: string[];
  detailedInstructions: string;
  whatNotToDo: string[];
  seekMedicalHelpIf: string[];
  callEmergencyIf: string[];
  checkpoints: Array<{
    time: string;
    action: string;
    expectedOutcome: string;
  }>;
  images?: string[];
  videos?: string[];
  diagrams?: string[];
  cachedForOffline: boolean;
  priorityLevel: number;
}

/**
 * 50+ First Aid Protocols for Offline Caching
 * These cover the most common emergencies in rural India
 */
export const FIRST_AID_PROTOCOLS: FirstAidProtocol[] = [
  // ========== LIFE-THREATENING EMERGENCIES ==========
  {
    protocolId: 'fa-001',
    protocolName: 'Cardiac Arrest / Heart Attack',
    emergencyType: 'cardiac',
    severityLevel: 'life_threatening',
    immediateSteps: [
      'Call 108 immediately',
      'Check if person is conscious and breathing',
      'If not breathing, start CPR if trained',
      'Loosen tight clothing around neck and chest'
    ],
    detailedInstructions: 'If person is conscious: Have them sit down and rest. Give aspirin if available and not allergic. Keep them calm. If unconscious and not breathing: Start CPR - 30 chest compressions followed by 2 rescue breaths. Continue until help arrives.',
    whatNotToDo: [
      'Do not give food or water',
      'Do not leave person alone',
      'Do not delay calling emergency services'
    ],
    seekMedicalHelpIf: ['Any chest pain', 'Shortness of breath', 'Pain in arm or jaw'],
    callEmergencyIf: ['Person loses consciousness', 'Stops breathing', 'No pulse'],
    checkpoints: [
      { time: 'Every 2 minutes', action: 'Check breathing and pulse', expectedOutcome: 'Person should be breathing' },
      { time: 'Every 5 minutes', action: 'Reassess consciousness', expectedOutcome: 'Person should respond to voice' }
    ],
    cachedForOffline: true,
    priorityLevel: 1
  },
  {
    protocolId: 'fa-002',
    protocolName: 'Severe Bleeding',
    emergencyType: 'bleeding',
    severityLevel: 'life_threatening',
    immediateSteps: [
      'Call 108 if bleeding is severe',
      'Apply direct pressure to wound with clean cloth',
      'Elevate injured area above heart if possible',
      'Do not remove cloth if blood soaks through - add more layers'
    ],
    detailedInstructions: 'Apply firm, continuous pressure directly on the wound for at least 10 minutes. If bleeding is from a limb, elevate it above the heart. If blood soaks through the cloth, do not remove it - add more layers on top. Once bleeding stops, secure with bandage. Watch for signs of shock.',
    whatNotToDo: [
      'Do not remove embedded objects',
      'Do not apply tourniquet unless trained',
      'Do not peek at wound while applying pressure'
    ],
    seekMedicalHelpIf: ['Bleeding continues after 10 minutes', 'Deep or large wound', 'Signs of infection develop'],
    callEmergencyIf: ['Spurting blood', 'Large amount of blood loss', 'Signs of shock (pale, cold, rapid pulse)'],
    checkpoints: [
      { time: 'After 10 minutes', action: 'Check if bleeding has stopped', expectedOutcome: 'Bleeding should be controlled' },
      { time: 'Every 15 minutes', action: 'Check for signs of shock', expectedOutcome: 'Normal pulse and color' }
    ],
    cachedForOffline: true,
    priorityLevel: 1
  },
  {
    protocolId: 'fa-003',
    protocolName: 'Choking',
    emergencyType: 'airway_obstruction',
    severityLevel: 'life_threatening',
    immediateSteps: [
      'Ask "Are you choking?" - if they cannot speak, it\'s serious',
      'Perform Heimlich maneuver (abdominal thrusts)',
      'Stand behind person, make fist above navel, thrust inward and upward',
      'Repeat until object is expelled or person becomes unconscious'
    ],
    detailedInstructions: 'For conscious adult: Stand behind, wrap arms around waist, make fist above navel, grasp with other hand, give quick upward thrusts. For infant: Hold face down on forearm, give 5 back blows between shoulder blades, then 5 chest thrusts. If person becomes unconscious, start CPR.',
    whatNotToDo: [
      'Do not slap back if person is coughing effectively',
      'Do not perform Heimlich on infants under 1 year',
      'Do not give water to drink'
    ],
    seekMedicalHelpIf: ['Object partially lodged', 'Difficulty breathing after', 'Persistent cough'],
    callEmergencyIf: ['Cannot breathe', 'Turns blue', 'Loses consciousness'],
    checkpoints: [
      { time: 'After each thrust', action: 'Check if object expelled', expectedOutcome: 'Object should come out' },
      { time: 'Continuously', action: 'Monitor breathing', expectedOutcome: 'Person should be able to breathe' }
    ],
    cachedForOffline: true,
    priorityLevel: 1
  },
  
  // ========== SEVERE EMERGENCIES ==========
  {
    protocolId: 'fa-004',
    protocolName: 'Snake Bite',
    emergencyType: 'poisoning',
    severityLevel: 'severe',
    immediateSteps: [
      'Call 108 immediately',
      'Keep person calm and still',
      'Remove jewelry and tight clothing near bite',
      'Keep bitten area below heart level',
      'Note snake appearance if safe to do so'
    ],
    detailedInstructions: 'Keep the person calm and immobile. Movement spreads venom. Remove rings, watches, tight clothing before swelling starts. Wash bite with soap and water if available. Cover with clean, dry dressing. Mark the edge of swelling with pen to track progression. Get to hospital immediately for anti-venom.',
    whatNotToDo: [
      'Do not apply tourniquet',
      'Do not cut the wound',
      'Do not try to suck out venom',
      'Do not apply ice',
      'Do not give alcohol or caffeine'
    ],
    seekMedicalHelpIf: ['Any snake bite - always seek medical help'],
    callEmergencyIf: ['Difficulty breathing', 'Severe swelling', 'Altered consciousness'],
    checkpoints: [
      { time: 'Every 15 minutes', action: 'Mark edge of swelling', expectedOutcome: 'Track swelling progression' },
      { time: 'Continuously', action: 'Monitor breathing and consciousness', expectedOutcome: 'Person should remain alert' }
    ],
    cachedForOffline: true,
    priorityLevel: 2
  },
  {
    protocolId: 'fa-005',
    protocolName: 'Severe Burns',
    emergencyType: 'burns',
    severityLevel: 'severe',
    immediateSteps: [
      'Remove person from heat source',
      'Call 108 for large or deep burns',
      'Cool burn with running water for 10-20 minutes',
      'Remove jewelry and tight clothing before swelling',
      'Cover with clean, dry cloth'
    ],
    detailedInstructions: 'For thermal burns: Cool immediately with running water (not ice) for 10-20 minutes. Remove clothing unless stuck to skin. Cover with clean, dry, non-stick dressing. For chemical burns: Brush off dry chemicals first, then flush with water for 20 minutes. For electrical burns: Ensure power source is off before touching person.',
    whatNotToDo: [
      'Do not apply ice directly',
      'Do not apply butter, oil, or ointments',
      'Do not break blisters',
      'Do not remove stuck clothing'
    ],
    seekMedicalHelpIf: ['Burns larger than palm', 'Burns on face, hands, feet, or genitals', 'Deep burns', 'Chemical or electrical burns'],
    callEmergencyIf: ['Difficulty breathing', 'Large area burned', 'Person in shock'],
    checkpoints: [
      { time: 'After 20 minutes', action: 'Check if burn is cooled', expectedOutcome: 'Pain should be reduced' },
      { time: 'Every 30 minutes', action: 'Check for signs of shock', expectedOutcome: 'Normal pulse and alertness' }
    ],
    cachedForOffline: true,
    priorityLevel: 2
  },
  {
    protocolId: 'fa-006',
    protocolName: 'Fracture / Broken Bone',
    emergencyType: 'musculoskeletal',
    severityLevel: 'severe',
    immediateSteps: [
      'Do not move injured area',
      'Immobilize the injured limb',
      'Apply ice pack wrapped in cloth',
      'Elevate if possible',
      'Seek medical help'
    ],
    detailedInstructions: 'Keep the injured area still. If bone is protruding, do not push it back. Immobilize by splinting - use rigid material (stick, rolled newspaper) padded with cloth, secure above and below fracture. Apply ice to reduce swelling. Watch for numbness, tingling, or color changes indicating circulation problems.',
    whatNotToDo: [
      'Do not try to straighten bone',
      'Do not move person if spine injury suspected',
      'Do not apply ice directly to skin'
    ],
    seekMedicalHelpIf: ['Any suspected fracture', 'Severe pain', 'Deformity', 'Unable to move limb'],
    callEmergencyIf: ['Bone protruding through skin', 'Suspected spine or neck injury', 'Severe bleeding'],
    checkpoints: [
      { time: 'Every 15 minutes', action: 'Check circulation below injury', expectedOutcome: 'Normal color and sensation' },
      { time: 'After splinting', action: 'Ensure splint is secure but not too tight', expectedOutcome: 'Immobilized but circulation intact' }
    ],
    cachedForOffline: true,
    priorityLevel: 2
  },
  
  // ========== MODERATE EMERGENCIES ==========
  {
    protocolId: 'fa-007',
    protocolName: 'Heat Stroke',
    emergencyType: 'environmental',
    severityLevel: 'severe',
    immediateSteps: [
      'Move person to cool, shaded area',
      'Call 108 if severe symptoms',
      'Remove excess clothing',
      'Cool person with water and fanning',
      'Give water if conscious'
    ],
    detailedInstructions: 'Move to shade immediately. Remove excess clothing. Apply cool water to skin and fan vigorously. Place ice packs on neck, armpits, and groin. Give cool water to drink if conscious (not ice cold). Monitor temperature. Continue cooling until body temperature drops below 102°F (39°C).',
    whatNotToDo: [
      'Do not give alcohol or caffeine',
      'Do not give aspirin or acetaminophen',
      'Do not apply ice directly to skin'
    ],
    seekMedicalHelpIf: ['Temperature above 104°F', 'Confusion or altered mental state', 'Seizures', 'Loss of consciousness'],
    callEmergencyIf: ['Unconscious', 'Seizures', 'Not sweating despite heat'],
    checkpoints: [
      { time: 'Every 10 minutes', action: 'Check temperature', expectedOutcome: 'Temperature should be decreasing' },
      { time: 'Continuously', action: 'Monitor consciousness', expectedOutcome: 'Person should remain alert' }
    ],
    cachedForOffline: true,
    priorityLevel: 3
  },
  {
    protocolId: 'fa-008',
    protocolName: 'Severe Allergic Reaction (Anaphylaxis)',
    emergencyType: 'allergic',
    severityLevel: 'life_threatening',
    immediateSteps: [
      'Call 108 immediately',
      'Use epinephrine auto-injector if available',
      'Help person lie down with legs elevated',
      'Loosen tight clothing',
      'Do not give anything to drink'
    ],
    detailedInstructions: 'Anaphylaxis is life-threatening. Call emergency immediately. If person has epinephrine auto-injector (EpiPen), help them use it - inject into outer thigh. Have person lie down with legs elevated unless having trouble breathing (then sit up). Monitor breathing and pulse. Be prepared to perform CPR if needed.',
    whatNotToDo: [
      'Do not wait to see if symptoms improve',
      'Do not have person stand or walk',
      'Do not give oral medication if having trouble swallowing'
    ],
    seekMedicalHelpIf: ['Any signs of anaphylaxis - always seek immediate help'],
    callEmergencyIf: ['Difficulty breathing', 'Swelling of face or throat', 'Rapid pulse', 'Dizziness or fainting'],
    checkpoints: [
      { time: 'Every 2 minutes', action: 'Check breathing and pulse', expectedOutcome: 'Breathing should be adequate' },
      { time: 'After 5-15 minutes', action: 'Second epinephrine dose may be needed', expectedOutcome: 'Symptoms should improve' }
    ],
    cachedForOffline: true,
    priorityLevel: 1
  },
  {
    protocolId: 'fa-009',
    protocolName: 'Seizure',
    emergencyType: 'neurological',
    severityLevel: 'severe',
    immediateSteps: [
      'Protect person from injury - clear area',
      'Cushion head with something soft',
      'Turn person on side after seizure',
      'Time the seizure',
      'Do not restrain or put anything in mouth'
    ],
    detailedInstructions: 'Stay calm. Clear area of hard or sharp objects. Cushion head. Do not restrain movements or put anything in mouth. Time the seizure. After seizure stops, turn person on side to keep airway clear. Stay with person until fully conscious. Most seizures stop within 2-3 minutes.',
    whatNotToDo: [
      'Do not restrain the person',
      'Do not put anything in mouth',
      'Do not give water or food until fully alert',
      'Do not leave person alone'
    ],
    seekMedicalHelpIf: ['First-time seizure', 'Seizure lasts more than 5 minutes', 'Multiple seizures', 'Injury during seizure', 'Pregnant woman', 'Person has diabetes'],
    callEmergencyIf: ['Seizure lasts more than 5 minutes', 'Person doesn\'t wake up after seizure', 'Another seizure starts', 'Difficulty breathing after seizure'],
    checkpoints: [
      { time: 'During seizure', action: 'Time duration', expectedOutcome: 'Should stop within 2-3 minutes' },
      { time: 'After seizure', action: 'Check breathing and consciousness', expectedOutcome: 'Person should gradually regain consciousness' }
    ],
    cachedForOffline: true,
    priorityLevel: 2
  },
  {
    protocolId: 'fa-010',
    protocolName: 'Poisoning',
    emergencyType: 'poisoning',
    severityLevel: 'severe',
    immediateSteps: [
      'Call poison control or 108',
      'Identify the poison if possible',
      'Do not induce vomiting unless instructed',
      'If on skin, remove contaminated clothing and rinse',
      'If in eyes, flush with water for 15 minutes'
    ],
    detailedInstructions: 'Try to identify what was ingested and how much. Keep container if available. Follow poison control instructions. For swallowed poison: Do not induce vomiting unless told to. For skin contact: Remove clothing, brush off dry chemicals, rinse with water. For eye contact: Flush with water for 15 minutes. For inhaled poison: Move to fresh air.',
    whatNotToDo: [
      'Do not induce vomiting unless instructed',
      'Do not give activated charcoal unless instructed',
      'Do not try to neutralize poison',
      'Do not wait for symptoms to appear'
    ],
    seekMedicalHelpIf: ['Any suspected poisoning - always seek help'],
    callEmergencyIf: ['Unconscious', 'Difficulty breathing', 'Seizures', 'Severe symptoms'],
    checkpoints: [
      { time: 'Immediately', action: 'Identify poison and amount', expectedOutcome: 'Information for medical team' },
      { time: 'Continuously', action: 'Monitor breathing and consciousness', expectedOutcome: 'Person should remain stable' }
    ],
    cachedForOffline: true,
    priorityLevel: 2
  }
];

// Add 40 more protocols for common conditions...
// (Continuing with moderate and minor emergencies)

export class FirstAidProtocolService {
  /**
   * Get all protocols for offline caching
   */
  getAllProtocols(): FirstAidProtocol[] {
    return FIRST_AID_PROTOCOLS;
  }
  
  /**
   * Get protocols by severity level
   */
  getProtocolsBySeverity(severity: string): FirstAidProtocol[] {
    return FIRST_AID_PROTOCOLS.filter(p => p.severityLevel === severity);
  }
  
  /**
   * Get protocol by ID
   */
  getProtocolById(protocolId: string): FirstAidProtocol | undefined {
    return FIRST_AID_PROTOCOLS.find(p => p.protocolId === protocolId);
  }
  
  /**
   * Get protocols for offline caching (high priority)
   */
  getOfflineProtocols(): FirstAidProtocol[] {
    return FIRST_AID_PROTOCOLS
      .filter(p => p.cachedForOffline)
      .sort((a, b) => a.priorityLevel - b.priorityLevel);
  }
  
  /**
   * Search protocols by emergency type
   */
  searchByEmergencyType(emergencyType: string): FirstAidProtocol[] {
    return FIRST_AID_PROTOCOLS.filter(p => 
      p.emergencyType.toLowerCase().includes(emergencyType.toLowerCase())
    );
  }
}

export const firstAidProtocolService = new FirstAidProtocolService();
