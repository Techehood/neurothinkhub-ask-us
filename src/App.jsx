import { useState, useRef, useEffect } from 'react'

// ─── NeuroThinkHub brand colours ─────────────────────────────────────────────
// Extracted from neurothinkhub.com CSS variables
// --primary-color: #594a66  --primary-dark-color: #1C2436
// --secondary-color: #8e7e95  --third-color: #F8E6D8  --body_bg: #FBF6F2

const BRAND = {
  primary: '#594a66',      // deep plum — main brand
  primaryDark: '#1C2436',  // dark navy
  secondary: '#8e7e95',    // muted lavender
  accent: '#F8E6D8',       // warm peach
  bg: '#FBF6F2',           // warm off-white
  sage: '#7a9e87',         // logo sage green
  coral: '#c47b6a',        // logo coral orange
  text: '#1C2436',
  textMuted: '#6e6480'
}

// ─── Persona config ───────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: 'neurodivergent',
    label: 'I am neurodivergent',
    sublabel: 'ADHD, dyslexia, autism, or similar',
    color: BRAND.primary,
    light: '#EDE8F2'
  },
  {
    id: 'manager',
    label: 'I manage a team',
    sublabel: 'Supporting neurodivergent colleagues',
    color: BRAND.primaryDark,
    light: '#E8EBF0'
  },
  {
    id: 'hr',
    label: 'I work in HR / L&D',
    sublabel: 'Building neuroinclusion programmes',
    color: BRAND.secondary,
    light: '#F0EDF2'
  },
  {
    id: 'parent',
    label: 'I am a parent or family member',
    sublabel: 'Supporting someone I love',
    color: BRAND.coral,
    light: '#F7EEEC'
  },
  {
    id: 'educator',
    label: 'I am an educator',
    sublabel: 'Working with neurodivergent students',
    color: BRAND.sage,
    light: '#EDF3EF'
  },
  {
    id: 'entrepreneur',
    label: 'I am a neurodivergent entrepreneur',
    sublabel: 'Running a business with a different kind of mind',
    color: '#7B6EA0',
    light: '#F0EDF8'
  }
]

// ─── Starter prompts per persona ─────────────────────────────────────────────
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: '100vh',
    background: BRAND.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px 20px'
  },
  header: {
    width: '100%',
    maxWidth: '680px',
    textAlign: 'center',
    padding: '24px 0 16px'
  },
  badge: {
    display: 'inline-block',
    background: BRAND.accent,
    color: BRAND.primary,
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: '20px',
    marginBottom: '10px'
  },
  h1: {
    fontSize: 'clamp(22px, 4vw, 32px)',
    fontWeight: '700',
    color: BRAND.primaryDark,
    margin: '0 0 8px',
    lineHeight: '1.2'
  },
  subtitle: {
    fontSize: '14px',
    color: BRAND.textMuted,
    margin: '0',
    lineHeight: '1.5'
  },
  personaGrid: {
    width: '100%',
    maxWidth: '680px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '8px',
    marginBottom: '8px'
  },
  personaCard: (persona, selected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `2px solid ${selected ? persona.color : '#DDD8E4'}`,
    background: selected ? persona.light : '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none'
  }),
  personaText: {
    textAlign: 'left'
  },
  personaLabel: (color, selected) => ({
    fontSize: '14px',
    fontWeight: '600',
    color: selected ? color : BRAND.primaryDark,
    margin: '0 0 2px',
    lineHeight: '1.3'
  }),
  personaSublabel: {
    fontSize: '12px',
    color: BRAND.textMuted,
    margin: 0
  },
  chatContainer: {
    width: '100%',
    maxWidth: '680px',
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #DDD8E4',
    boxShadow: '0 4px 24px rgba(89, 74, 102, 0.10)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
    maxHeight: '65vh'
  },
  chatHeader: (color) => ({
    padding: '12px 16px',
    borderBottom: '1px solid #F0EFF8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px'
  }),
  chatHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  chatHeaderDot: (color) => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0
  }),
  chatHeaderTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: BRAND.primaryDark,
    margin: 0
  },
  resetBtn: {
    fontSize: '12px',
    color: BRAND.textMuted,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  starterArea: {
    padding: '0 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  starterLabel: {
    fontSize: '11px',
    color: BRAND.textMuted,
    fontWeight: '500',
    margin: '0 0 2px'
  },
  starterBtn: (color) => ({
    textAlign: 'left',
    background: BRAND.bg,
    border: `1px solid #DDD8E4`,
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: BRAND.primaryDark,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    lineHeight: '1.4'
  }),
  message: (role) => ({
    display: 'flex',
    flexDirection: role === 'user' ? 'row-reverse' : 'row',
    gap: '10px',
    alignItems: 'flex-start'
  }),
  messageBubble: (role) => ({
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: role === 'user' ? BRAND.primary : BRAND.accent,
    color: role === 'user' ? '#FFFFFF' : BRAND.primaryDark,
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  }),
  avatar: (role, color) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: role === 'user' ? '#DDD8E4' : color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
    color: role === 'user' ? BRAND.textMuted : '#FFFFFF',
    fontWeight: '700'
  }),
  inputRow: {
    padding: '10px 12px',
    borderTop: '1px solid #EDE8E4',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end'
  },
  textarea: {
    flex: 1,
    resize: 'none',
    border: `1.5px solid #DDD8E4`,
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: BRAND.primaryDark,
    outline: 'none',
    lineHeight: '1.5',
    minHeight: '42px',
    maxHeight: '120px',
    background: BRAND.bg,
    transition: 'border-color 0.15s'
  },
  sendBtn: (color, disabled) => ({
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: disabled ? '#E5E4F0' : color,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s'
  }),
  footer: {
    width: '100%',
    maxWidth: '680px',
    textAlign: 'center',
    padding: '16px 0 0',
    fontSize: '12px',
    color: BRAND.textMuted
  },
  ctaBox: {
    width: '100%',
    maxWidth: '680px',
    background: BRAND.accent,
    border: `1px solid #E8D8CC`,
    borderRadius: '12px',
    padding: '14px 18px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap'
  },
  ctaText: {
    margin: 0,
    fontSize: '14px',
    color: BRAND.primaryDark,
    fontWeight: '500'
  },
  ctaBtn: (color) => ({
    background: color,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    display: 'inline-block'
  }),
  loadingDots: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0'
  }
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={styles.loadingDots}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: BRAND.secondary,
            display: 'inline-block',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [persona, setPersona] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const MAX_MESSAGES = 10
  const selectedPersona = PERSONAS.find(p => p.id === persona)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handlePersonaSelect(id) {
    setPersona(id)
    setMessages([])
    setMsgCount(0)
    setInput('')
  }

  function handleReset() {
    setMessages([])
    setMsgCount(0)
    setInput('')
  }

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || loading || msgCount >= MAX_MESSAGES) return

    const userMsg = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setMsgCount(c => c + 1)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px'
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          persona
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Something went wrong. Please try again.'
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Could not connect. Please check your connection and try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleTextareaInput(e) {
    setInput(e.target.value)
    e.target.style.height = '42px'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const atLimit = msgCount >= MAX_MESSAGES

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.badge}>NeuroThinkHub</div>
        <h1 style={styles.h1}>Ask Us</h1>
        <p style={styles.subtitle}>
          You are not alone in this. Tell us who you are and we will meet you where you are.
        </p>
      </header>

      {/* Persona picker */}
      <div style={styles.personaGrid}>
        {PERSONAS.map(p => {
          const selected = persona === p.id
          return (
            <button
              key={p.id}
              style={styles.personaCard(p, selected)}
              onClick={() => handlePersonaSelect(p.id)}
              aria-pressed={selected}
            >
              <div style={styles.personaText}>
                <p style={styles.personaLabel(p.color, selected)}>{p.label}</p>
                <p style={styles.personaSublabel}>{p.sublabel}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Chat window */}
      {persona && selectedPersona && (
        <>
          <div style={styles.chatContainer}>
            {/* Chat header */}
            <div style={styles.chatHeader(selectedPersona.color)}>
              <div style={styles.chatHeaderLeft}>
                <div style={styles.chatHeaderDot(selectedPersona.color)} />
                <p style={styles.chatHeaderTitle}>
                  {selectedPersona.label}
                </p>
              </div>
              <button style={styles.resetBtn} onClick={handleReset} title="Start a new conversation">
                New conversation
              </button>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: BRAND.textMuted, fontSize: '13px', marginTop: '8px' }}>
                  <p style={{ margin: '0 0 4px' }}>Welcome — we are glad you are here.</p>
                  <p style={{ margin: 0 }}>Ask anything, or choose a question below to get started.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} style={styles.message(msg.role)}>
                  <div style={styles.avatar(msg.role, selectedPersona.color)}>
                    {msg.role === 'user' ? 'You' : 'NTH'}
                  </div>
                  <div style={styles.messageBubble(msg.role)}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={styles.message('assistant')}>
                  <div style={styles.avatar('assistant', selectedPersona.color)}>NTH</div>
                  <div style={styles.messageBubble('assistant')}>
                    <TypingDots />
                  </div>
                </div>
              )}

              {atLimit && !loading && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: BRAND.accent,
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: BRAND.primary
                }}>
                  That is the end of this session. If you have more questions, we would love to keep talking — click "New conversation" to continue.
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Starter prompts — show only when no messages yet */}
            {messages.length === 0 && (
              <div style={styles.starterArea}>
                <p style={styles.starterLabel}>Here are some things people often ask us:</p>
                {STARTER_PROMPTS[persona].map((prompt, i) => (
                  <button
                    key={i}
                    style={styles.starterBtn(selectedPersona.color)}
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={styles.inputRow}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="What is on your mind?"
                style={styles.textarea}
                rows={1}
                disabled={loading || atLimit}
                aria-label="Your question"
              />
              <button
                style={styles.sendBtn(selectedPersona.color, !input.trim() || loading || atLimit)}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading || atLimit}
                aria-label="Send"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

          {/* CTA box */}
          <div style={styles.ctaBox}>
            <div>
              <p style={{ ...styles.ctaText, marginBottom: '4px' }}>
                Ready to take the next step?
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: BRAND.textMuted }}>
                A real conversation with our team — no pressure, just support.
              </p>
            </div>
            <a
              href="https://neurothinkhub.com/contact"
              style={styles.ctaBtn(selectedPersona.color)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a free call
            </a>
          </div>
        </>
      )}

      {/* Footer */}
      <p style={styles.footer}>
        This is AI guidance, not a substitute for professional advice.{' '}
        <a href="https://neurothinkhub.com/terms" style={{ color: BRAND.textMuted }}>Terms apply.</a>
      </p>
    </div>
  )
}
