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
// PERSONAS — 6 user types
// label = full text shown in chat header
// chipLabel = short text shown in chip selector
// ============================================================
const PERSONAS = [
  { id: 'neurodivergent', label: 'I am neurodivergent', chipLabel: 'Neurodivergent', sublabel: 'ADHD, dyslexia, autism, or similar', color: BRAND.primary, light: '#EDE8F2' },
  { id: 'manager', label: 'I manage a team', chipLabel: 'Manager', sublabel: 'Supporting neurodivergent colleagues', color: BRAND.primaryDark, light: '#E8EBF0' },
  { id: 'hr', label: 'I work in HR / L&D', chipLabel: 'HR / L&D', sublabel: 'Building neuroinclusion programmes', color: BRAND.secondary, light: '#F0EDF2' },
  { id: 'parent', label: 'I am a parent or family member', chipLabel: 'Parent / Family', sublabel: 'Supporting someone I love', color: BRAND.coral, light: '#F7EEEC' },
  { id: 'educator', label: 'I am an educator', chipLabel: 'Educator', sublabel: 'Working with neurodivergent students', color: BRAND.sage, light: '#EDF3EF' },
  { id: 'entrepreneur', label: 'Neurodivergent entrepreneur', chipLabel: 'Entrepreneur', sublabel: 'Running a business with a different kind of mind', color: '#7B6EA0', light: '#F0EDF8' }
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
  { label: 'ADHD', color: BRAND.primary, light: '#EDE8F2' },
  { label: 'Dyslexia', color: BRAND.coral, light: '#F7EEEC' },
  { label: 'Autism', color: BRAND.sage, light: '#EDF3EF' },
  { label: 'Dyspraxia', color: BRAND.secondary, light: '#F0EDF2' },
  { label: 'Dyscalculia', color: '#7B6EA0', light: '#F0EDF8' },
  { label: 'Sensory Processing', color: BRAND.primaryDark, light: '#E8EBF0' },
  { label: "Tourette's", color: BRAND.textMuted, light: '#F5F3F8' }
]

const SOLUTIONS = [
  { label: 'Self-discovery', color: BRAND.primary, light: '#EDE8F2' },
  { label: 'Workplace tools', color: BRAND.sage, light: '#EDF3EF' },
  { label: 'The Bridge', color: BRAND.coral, light: '#F7EEEC' },
  { label: '1:1 Coaching', color: BRAND.secondary, light: '#F0EDF2' },
  { label: 'Community', color: '#7B6EA0', light: '#F0EDF8' },
  { label: 'Workshops', color: BRAND.primaryDark, light: '#E8EBF0' },
  { label: 'Assessments', color: BRAND.textMuted, light: '#F5F3F8' }
]

// ============================================================
// TREE SVG — Decorative calming tree illustration
// Used at the top of each side panel
// ============================================================
function TreeSVG({ trunkColor, canopyColor, canopyLight }) {
  return (
    <svg viewBox="0 0 100 118" style={{ width: '64px', display: 'block', margin: '0 auto 10px' }}>
      <ellipse cx="50" cy="114" rx="15" ry="4" fill={canopyColor} opacity="0.45" />
      <path d="M 50 110 C 50 92 49 72 48 50"
        stroke={trunkColor} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M 49 105 C 42 103 36 106 32 109"
        stroke={trunkColor} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3" />
      <path d="M 50 105 C 57 103 63 106 67 109"
        stroke={trunkColor} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3" />
      <circle cx="48" cy="44" r="22" fill={canopyColor} opacity="0.6" />
      <circle cx="30" cy="54" r="14" fill={canopyLight} opacity="0.55" />
      <circle cx="67" cy="51" r="15" fill={canopyLight} opacity="0.5" />
      <circle cx="48" cy="24" r="14" fill={canopyColor} opacity="0.45" />
      <circle cx="31" cy="36" r="9"  fill={canopyLight} opacity="0.38" />
      <circle cx="65" cy="33" r="10" fill={canopyLight} opacity="0.38" />
      <circle cx="48" cy="10" r="7" fill={canopyColor} opacity="0.28" />
    </svg>
  )
}

// ============================================================
// NEURO PANEL — Side panel component
// Tree illustration + title + coloured chip list
// ============================================================
function NeuroPanel({ title, items, trunkColor, canopyColor, canopyLight }) {
  return (
    <div style={{ padding: '28px 10px 20px', display: 'flex', flexDirection: 'column', align
