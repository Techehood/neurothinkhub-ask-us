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
// Hidden on mobile to save screen space
// ============================================================
function NeuroPanel({ title, items, trunkColor, canopyColor, canopyLight }) {
  return (
    <div style={{ padding: '28px 10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
      <TreeSVG trunkColor={trunkColor} canopyColor={canopyColor} canopyLight={canopyLight} />
      <h3 style={{ fontSize: '13px', fontWeight: 600, color: BRAND.text, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: item.light, color: item.color, fontSize: '12.5px', fontWeight: 500, padding: '7px 10px', borderRadius: '8px', textAlign: 'center' }}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// PERSONA BAR — single-line "I am..." selector
// Collapses to a small pill once a persona is chosen, so the
// chat takes over the screen instead of 6 big buttons.
// ============================================================
function PersonaBar({ persona, onChoose, onChangeClick }) {
  const chosen = PERSONAS.find(p => p.id === persona)

  if (chosen) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderBottom: `1px solid ${BRAND.accent}` }}>
        <span style={{ fontSize: '12px', color: BRAND.textMuted }}>I am:</span>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: chosen.color, background: chosen.light, padding: '4px 10px', borderRadius: '999px' }}>
          {chosen.chipLabel}
        </span>
        <button
          onClick={onChangeClick}
          style={{ marginLeft: 'auto', fontSize: '12px', color: BRAND.textMuted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: '4px' }}
        >
          change
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '14px' }}>
      <p style={{ fontSize: '13px', color: BRAND.textMuted, margin: '0 0 10px' }}>I am...</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {PERSONAS.map(p => (
          <button
            key={p.id}
            onClick={() => onChoose(p.id)}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: p.color,
              background: p.light,
              border: 'none',
              borderRadius: '999px',
              padding: '8px 14px',
              cursor: 'pointer'
            }}
            title={p.sublabel}
          >
            {p.chipLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// MAIN APP — chat widget
// ============================================================
export default function App() {
  const [persona, setPersona] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 860 : false)

  const inputRef = useRef(null)
  const lastMessageRef = useRef(null)

  // Track viewport width so side panels hide on small screens
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 860)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Focus the chat input as soon as a persona is confirmed
  useEffect(() => {
    if (persona && inputRef.current) {
      inputRef.current.focus()
    }
  }, [persona])

  // Scroll fix: when a new message arrives, scroll to the TOP of that
  // message (not the bottom of the page) so mobile users read from the
  // start of the answer instead of having to scroll back up.
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [messages])

  async function sendMessage(text) {
    const content = (text !== undefined ? text : input).trim()
    if (!content || loading || !persona) return

    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, persona })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError('Could not reach NeuroThinkHub right now. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleChoosePersona(id) {
    setPersona(id)
  }

  function handleChangePersona() {
    setPersona(null)
  }

  const starterPrompts = persona ? STARTER_PROMPTS[persona] : []

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      minHeight: '100vh',
      background: BRAND.bg,
      fontFamily: 'Lexend, sans-serif',
      color: BRAND.text
    }}>
      {!isMobile && (
        <NeuroPanel
          title="ND Types"
          items={ND_TYPES}
          trunkColor={BRAND.primaryDark}
          canopyColor={BRAND.primary}
          canopyLight={BRAND.secondary}
        />
      )}

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '720px',
        margin: '0 auto',
        background: '#fff',
        minHeight: '100vh'
      }}>
        <div style={{ padding: '16px 14px 6px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: BRAND.primary }}>Ask NeuroThinkHub</h1>
          <p style={{ fontSize: '12px', color: BRAND.textMuted, margin: '4px 0 0' }}>
            Grounded guidance, not a diagnosis. If you're in distress, please reach out to a professional or someone you trust.
          </p>
        </div>

        <PersonaBar persona={persona} onChoose={handleChoosePersona} onChangeClick={handleChangePersona} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
          {!persona && (
            <p style={{ fontSize: '13px', color: BRAND.textMuted }}>
              Choose who you are above to get started.
            </p>
          )}

          {persona && messages.length === 0 && (
            <div>
              <p style={{ fontSize: '13px', color: BRAND.textMuted, marginBottom: '10px' }}>Try asking:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {starterPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      textAlign: 'left',
                      fontSize: '13.5px',
                      color: BRAND.text,
                      background: BRAND.accent,
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1
            return (
              <div
                key={i}
                ref={isLast ? lastMessageRef : null}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  background: msg.role === 'user' ? BRAND.primary : BRAND.bg,
                  color: msg.role === 'user' ? '#fff' : BRAND.text,
                  borderRadius: '14px',
                  padding: '10px 14px',
                  fontSize: '14.5px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            )
          })}

          {loading && (
            <div style={{ fontSize: '13px', color: BRAND.textMuted, padding: '6px 0' }}>Thinking…</div>
          )}

          {error && (
            <div style={{ fontSize: '13px', color: BRAND.coral, padding: '6px 0' }}>{error}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', borderTop: `1px solid ${BRAND.accent}` }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!persona || loading}
            placeholder={persona ? 'Type your question…' : 'Choose who you are above first'}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border: `1px solid ${BRAND.accent}`,
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '14px',
              fontFamily: 'inherit',
              color: BRAND.text
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!persona || loading || !input.trim()}
            style={{
              background: BRAND.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '0 18px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: (!persona || loading || !input.trim()) ? 0.5 : 1
            }}
          >
            Send
          </button>
        </div>
      </div>

      {!isMobile && (
        <NeuroPanel
          title="Solutions"
          items={SOLUTIONS}
          trunkColor={BRAND.sage}
          canopyColor={BRAND.coral}
          canopyLight={BRAND.secondary}
        />
      )}
    </div>
  )
}
