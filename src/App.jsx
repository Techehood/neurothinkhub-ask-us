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
    <div style={{ padding: '28px 10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <TreeSVG trunkColor={trunkColor} canopyColor={canopyColor} canopyLight={canopyLight} />
      <p style={{
        fontSize: '10px', fontWeight: '700', color: trunkColor,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        margin: '0 0 12px', textAlign: 'center', lineHeight: '1.4'
      }}>{title}</p>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '5px 8px', borderRadius: '8px', background: item.light
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: item.color, lineHeight: '1.3' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// TYPING DOTS — Animated indicator shown while AI is thinking
// ============================================================
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#8e7e95', display: 'inline-block',
          animation: `nth-bounce 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
      <style>{`
        @keyframes nth-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// STYLES — Shared inline style objects
// To edit a component's look, find it by name below
// ============================================================
const S = {
  // Page header — NeuroThinkHub badge, Ask Us title, subtitle
  header: { width: '100%', maxWidth: '680px', textAlign: 'center', padding: '24px 0 16px' },
  badge: {
    display: 'inline-block', background: '#F8E6D8', color: '#594a66',
    fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em',
    textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px', marginBottom: '10px'
  },
  h1: { fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '700', color: '#1C2436', margin: '0 0 8px', lineHeight: '1.2' },
  subtitle: { fontSize: '14px', color: '#6e6480', margin: '0', lineHeight: '1.5' },

  // Persona grid — 2 columns desktop, 1 column mobile (via CSS class nth-persona-grid)
  personaGrid: {
    width: '100%', maxWidth: '680px',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '8px', marginBottom: '8px'
  },
  personaCard: (persona, selected) => ({
    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
    borderRadius: '12px', border: `2px solid ${selected ? persona.color : '#DDD8E4'}`,
    background: selected ? persona.light : '#FFFFFF',
    cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none'
  }),
  personaLabel: (color, selected) => ({
    fontSize: '14px', fontWeight: '600',
    color: selected ? color : '#1C2436', margin: '0 0 2px', lineHeight: '1.3'
  }),
  personaSublabel: { fontSize: '12px', color: '#6e6480', margin: 0 },

  // Chat container — the main white box with messages
  chatContainer: {
    width: '100%', maxWidth: '680px', background: '#FFFFFF',
    borderRadius: '16px', border: '1px solid #DDD8E4',
    boxShadow: '0 4px 24px rgba(89,74,102,0.10)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', minHeight: '400px', maxHeight: '65vh'
  },

  // Chat header — persona name + New conversation button
  chatHeader: {
    padding: '12px 16px', borderBottom: '1px solid #F0EFF8',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
  },
  chatHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  chatHeaderDot: (color) => ({ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }),
  chatHeaderTitle: { fontSize: '14px', fontWeight: '600', color: '#1C2436', margin: 0 },
  resetBtn: { fontSize: '12px', color: '#6e6480', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' },

  // Messages area — scrollable list of chat bubbles
  messagesArea: { flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },

  // Starter prompts — shown before first message
  starterArea: { padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '6px' },
  starterLabel: { fontSize: '11px', color: '#6e6480', fontWeight: '500', margin: '0 0 2px' },
  starterBtn: { textAlign: 'left', background: '#FBF6F2', border: '1px solid #DDD8E4', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1C2436', cursor: 'pointer', transition: 'all 0.1s ease', lineHeight: '1.4' },

  // Message bubbles — user (right, purple) and assistant (left, cream)
  message: (role) => ({ display: 'flex', flexDirection: role === 'user' ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-start' }),
  messageBubble: (role) => ({
    maxWidth: '85%', padding: '12px 16px',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: role === 'user' ? '#594a66' : '#F8E6D8',
    color: role === 'user' ? '#FFFFFF' : '#1C2436',
    fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap'
  }),
  avatar: (role, color) => ({
    width: '32px', height: '32px', borderRadius: '50%',
    background: role === 'user' ? '#DDD8E4' : color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', flexShrink: 0,
    color: role === 'user' ? '#6e6480' : '#FFFFFF', fontWeight: '700'
  }),

  // Input row — text area + send button
  inputRow: { padding: '10px 12px', borderTop: '1px solid #EDE8E4', display: 'flex', gap: '8px', alignItems: 'flex-end' },
  textarea: {
    flex: 1, resize: 'none', border: '1.5px solid #DDD8E4', borderRadius: '12px',
    padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', color: '#1C2436',
    outline: 'none', lineHeight: '1.5', minHeight: '42px', maxHeight: '120px',
    background: '#FBF6F2', transition: 'border-color 0.15s'
  },
  sendBtn: (color, disabled) => ({
    width: '42px', height: '42px', borderRadius: '12px',
    background: disabled ? '#E5E4F0' : color, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.15s'
  }),

  // CTA box — Book a free call banner below chat
  ctaBox: {
    width: '100%', maxWidth: '680px', background: '#F8E6D8',
    border: '1px solid #E8D8CC', borderRadius: '12px', padding: '14px 18px',
    marginTop: '8px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
  },
  ctaBtn: (color) => ({
    background: color, color: '#FFFFFF', border: 'none', borderRadius: '10px',
    padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block'
  })
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {

  // ── State ─────────────────────────────────────────────────
  const [persona, setPersona] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // ── Config ────────────────────────────────────────────────
  // MAX_MESSAGES — increase this to allow longer sessions
  const MAX_MESSAGES = 20
  const selectedPersona = PERSONAS.find(p => p.id === persona)

  // ── Auto-scroll to latest message ─────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // ── Persona selection — resets conversation ───────────────
  function handlePersonaSelect(id) { setPersona(id); setMessages([]); setMsgCount(0); setInput('') }

  // ── Reset conversation ────────────────────────────────────
  function handleReset() { setMessages([]); setMsgCount(0); setInput('') }

  // ── Send message to API ───────────────────────────────────
  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || loading || msgCount >= MAX_MESSAGES) return
    const userMsg = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setMsgCount(c => c + 1)
    if (textareaRef.current) textareaRef.current.style.height = '42px'
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), persona })
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Something went wrong. Please try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not connect. Please check your connection and try again.' }])
    } finally { setLoading(false) }
  }

  // ── Keyboard — Enter to send, Shift+Enter for new line ────
  function handleKeyDown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }

  // ── Auto-resize textarea as user types ───────────────────
  function handleTextareaInput(e) {
    setInput(e.target.value)
    e.target.style.height = '42px'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const atLimit = msgCount >= MAX_MESSAGES

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* ====================================================
          GLOBAL CSS
          - nth-root: full-width flex row (left panel | main | right panel)
          - nth-side: 210px side panels, hidden below 1080px
          - nth-main: centre column, max 680px
          - nth-persona-grid: 2 cols desktop, 1 col mobile (below 600px)
          - nth-terms: footer disclaimer box
          ==================================================== */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #FBF6F2; }
        .nth-root {
          display: flex;
          flex-direction: row;
          justify-content: center;
          min-height: 100vh;
          background: #FBF6F2;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .nth-side {
          width: 210px;
          min-width: 210px;
          flex-shrink: 0;
          background: #FBF6F2;
          border-right: 1px solid #EDE8E4;
        }
        .nth-side:last-child {
          border-right: none;
          border-left: 1px solid #EDE8E4;
        }
        .nth-main {
          flex: 1;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 16px 24px;
        }
        .nth-persona-grid {
          width: 100%;
          max-width: 680px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 8px;
          margin-bottom: 8px;
        }
        .nth-terms {
          width: 100%;
          max-width: 680px;
          margin-top: 16px;
          padding: 14px 16px;
          background: #FFFFFF;
          border: 1px solid #EDE8E4;
          border-radius: 12px;
          font-size: 11px;
          color: #6e6480;
          line-height: 1.6;
          text-align: center;
        }
        .nth-terms a { color: #594a66; text-decoration: underline; }
        .nth-terms strong { color: #1C2436; font-weight: 600; }

        /* Tablet — hide side panels */
        @media (max-width: 1080px) {
          .nth-side { display: none; }
        }

        /* Mobile — single column persona cards, tighter padding */
        @media (max-width: 600px) {
          .nth-main { padding: 0 10px 20px; }
          .nth-persona-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="nth-root">

        {/* ── Left panel: Neurodivergent types ── */}
        <div className="nth-side">
          <NeuroPanel
            title="Neurodivergent Minds"
            items={ND_TYPES}
            trunkColor="#594a66"
            canopyColor="#EDE8F2"
            canopyLight="#F0EDF2"
          />
        </div>

        {/* ── Centre: Main content ── */}
        <div className="nth-main">

          {/* Header */}
          <header style={S.header}>
            <div style={S.badge}>NeuroThinkHub</div>
            <h1 style={S.h1}>Ask Us</h1>
            <p style={S.subtitle}>
              You are not alone in this. Tell us who you are and we will meet you where you are.
            </p>
          </header>

          {/* Persona selection cards */}
          <div className="nth-persona-grid">
            {PERSONAS.map(p => {
              const selected = persona === p.id
              return (
                <button key={p.id} style={S.personaCard(p, selected)}
                  onClick={() => handlePersonaSelect(p.id)} aria-pressed={selected}>
                  <div style={{ textAlign: 'left' }}>
                    <p style={S.personaLabel(p.color, selected)}>{p.label}</p>
                    <p style={S.personaSublabel}>{p.sublabel}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Chat — only shown after persona selected */}
          {persona && selectedPersona && (
            <>
              {/* Chat box */}
              <div style={S.chatContainer}>

                {/* Chat header — persona name + reset button */}
                <div style={S.chatHeader}>
                  <div style={S.chatHeaderLeft}>
                    <div style={S.chatHeaderDot(selectedPersona.color)} />
                    <p style={S.chatHeaderTitle}>{selectedPersona.label}</p>
                  </div>
                  <button style={S.resetBtn} onClick={handleReset}>New conversation</button>
                </div>

                {/* Messages */}
                <div style={S.messagesArea}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#6e6480', fontSize: '13px', marginTop: '8px' }}>
                      <p style={{ margin: '0 0 4px' }}>Welcome — we are glad you are here.</p>
                      <p style={{ margin: 0 }}>Ask anything, or choose a question below to get started.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} style={S.message(msg.role)}>
                      <div style={S.avatar(msg.role, selectedPersona.color)}>
                        {msg.role === 'user' ? 'You' : 'NTH'}
                      </div>
                      <div style={S.messageBubble(msg.role)}>{msg.content}</div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {loading && (
                    <div style={S.message('assistant')}>
                      <div style={S.avatar('assistant', selectedPersona.color)}>NTH</div>
                      <div style={S.messageBubble('assistant')}><TypingDots /></div>
                    </div>
                  )}

                  {/* Session limit message — shown when MAX_MESSAGES reached */}
                  {atLimit && !loading && (
                    <div style={{ textAlign: 'center', padding: '16px', background: '#F8E6D8', borderRadius: '12px', fontSize: '13px', color: '#594a66' }}>
                      <p style={{ margin: '0 0 10px' }}>That is the end of this session — we hope it was helpful.</p>
                      <button onClick={handleReset} style={{
                        background: '#594a66', color: '#fff', border: 'none',
                        borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
                        fontWeight: '600', cursor: 'pointer'
                      }}>Start new conversation</button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Starter prompts — hidden once conversation begins */}
                {messages.length === 0 && (
                  <div style={S.starterArea}>
                    <p style={S.starterLabel}>Here are some things people often ask us:</p>
                    {STARTER_PROMPTS[persona].map((prompt, i) => (
                      <button key={i} style={S.starterBtn} onClick={() => sendMessage(prompt)}>{prompt}</button>
                    ))}
                  </div>
                )}

                {/* Input row — textarea + send button */}
                <div style={S.inputRow}>
                  <textarea
                    ref={textareaRef} value={input}
                    onChange={handleTextareaInput} onKeyDown={handleKeyDown}
                    placeholder="What is on your mind?" style={S.textarea}
                    rows={1} disabled={loading || atLimit} aria-label="Your question"
                  />
                  <button
                    style={S.sendBtn(selectedPersona.color, !input.trim() || loading || atLimit)}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading || atLimit} aria-label="Send"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* CTA — Book a free call */}
              <div style={S.ctaBox}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#1C2436', fontWeight: '500' }}>
                    Ready to take the next step?
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6e6480' }}>
                    A real conversation with our team — no pressure, just support.
                  </p>
                </div>
                <a href="https://neurothinkhub.com/contact" style={S.ctaBtn(selectedPersona.color)}
                  target="_blank" rel="noopener noreferrer">
                  Book a free call
                </a>
              </div>
            </>
          )}

          {/* Terms footer */}
          <div className="nth-terms">
            <strong>Ask Us</strong> is powered by Claude AI (Anthropic) and provides general guidance only.
            It is not a substitute for professional medical, psychological, legal, or educational advice.
            {' '}Your conversations are not stored by NeuroThinkHub.
            <br />
            By using this service you agree to our{' '}
            <a href="https://neurothinkhub.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            {' '}and{' '}
            <a href="https://neurothinkhub.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </div>

        </div>

        {/* ── Right panel: Support & Solutions ── */}
        <div className="nth-side">
          <NeuroPanel
            title="Support & Solutions"
            items={SOLUTIONS}
            trunkColor="#7a9e87"
            canopyColor="#EDF3EF"
            canopyLight="#EDE8F2"
          />
        </div>

      </div>
    </>
  )
}
