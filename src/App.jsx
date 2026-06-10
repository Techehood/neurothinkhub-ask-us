// ============================================================
// IMPORTS
// ============================================================
import { useState, useRef, useEffect } from 'react'

// ============================================================
// BRAND COLOURS — NeuroThinkHub design tokens
// ============================================================
const BRAND = {
  primary: '#594a66',
  primaryDark: '#1C2436',
  secondary: '#8e7e95',
  accent: '#F8E6D8',
  bg: '#FBF6F2',
  sage: '#7a9e87',
  coral: '#c47b6a',
  text: '#1C2436',
  textMuted: '#6e6480'
}

// ============================================================
// PERSONAS — The 6 user types shown as selection cards
// ============================================================
const PERSONAS = [
  { id: 'neurodivergent', label: 'I am neurodivergent', sublabel: 'ADHD, dyslexia, autism, or similar', color: BRAND.primary, light: '#EDE8F2' },
  { id: 'manager', label: 'I manage a team', sublabel: 'Supporting neurodivergent colleagues', color: BRAND.primaryDark, light: '#E8EBF0' },
  { id: 'hr', label: 'I work in HR / L&D', sublabel: 'Building neuroinclusion programmes', color: BRAND.secondary, light: '#F0EDF2' },
  { id: 'parent', label: 'I am a parent or family member', sublabel: 'Supporting someone I love', color: BRAND.coral, light: '#F7EEEC' },
  { id: 'educator', label: 'I am an educator', sublabel: 'Working with neurodivergent students', color: BRAND.sage, light: '#EDF3EF' },
  { id: 'entrepreneur', label: 'I am a neurodivergent entrepreneur', sublabel: 'Running a business with a different kind of mind', color: '#7B6EA0', light: '#F0EDF8' }
]

// ============================================================
// STARTER PROMPTS — 3 suggested questions per persona
// shown before the user types anything
// ============================================================
const STARTER_PROMPTS = {
  neurodivergent: [
    'Why do I struggle so much with starting tasks?',
    'How do I explain my needs to my manager?',
    'What is executive dysfunction and how do I manage it?'
  ],
  manager: [
    'How do I have a sensitive conversation about performance?',
    'What adjustments actually make a difference?',
    'How do I support someone who may be undiagnosed?'
  ],
  hr: [
    'How do we build a disclosure-safe culture?',
    'What should a neurodiversity policy include?',
    'How do we measure the impact of our neuroinclusion work?'
  ],
  parent: [
    'My child has just been diagnosed — where do I start?',
    'How do I support them without taking over?',
    'What can I ask their school or employer to do?'
  ],
  educator: [
    'What classroom adjustments make the biggest difference?',
    'How do I support a student who masks well?',
    'How do I talk to parents about possible neurodivergence?'
  ],
  entrepreneur: [
    'How do I manage the chaos of running a business with ADHD?',
    'How do I structure my day when routine feels impossible?',
    'What does a neuroinclusive business actually look like?'
  ]
}

// ============================================================
// SIDE PANEL DATA
// Left panel = ND types | Right panel = Solutions
// ============================================================
const ND_TYPES = [
  { label: 'ADHD', color
