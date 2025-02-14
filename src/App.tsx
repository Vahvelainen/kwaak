import { useState, useEffect, useRef } from 'react'
import { PaperAirplaneIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'
import Anthropic from '@anthropic-ai/sdk'
import './App.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const storedApiKey = localStorage.getItem('claude-api-key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
  }, [])

  const saveApiKey = () => {
    localStorage.setItem('claude-api-key', apiKey)
    setShowSettings(false)
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    if (!apiKey) {
      setShowSettings(true)
      return
    }

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: input }
    ]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    try {
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: 'You are Kwaak, a rubber duck debugging assistant. You always say "Kwaak!" at the start of your messages and ask obvious questions to help developers think through their problems. Keep your responses short and duck-like.',
        messages: newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true
      });

      // Add an empty assistant message that we'll stream into
      setMessages([...newMessages, { role: 'assistant', content: '', isStreaming: true }])
      
      let fullContent = ''
      for await (const chunk of response) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          fullContent += chunk.delta.text || ''
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: fullContent,
              isStreaming: true
            }
            return updated
          })
        }
      }

      // Mark message as complete
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: fullContent,
          isStreaming: false
        }
        return updated
      })
    } catch (error) {
      console.error('Error:', error)
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Kwaak! Something went wrong! (Error communicating with the API)'
      }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="app-container">
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <div className="settings-header">
              <h2>Settings</h2>
              <button onClick={() => setShowSettings(false)} className="close-button">×</button>
            </div>
            <div className="input-group">
              <label>Claude API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="api-key-input"
                placeholder="sk-..."
              />
              <p className="api-key-help">Your API key will be stored locally in your browser.</p>
            </div>
            <button onClick={saveApiKey} className="save-key-button">
              Save Settings
            </button>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="header">
          <div></div>
          <button onClick={() => setShowSettings(true)} className="settings-button" title="Settings">
            <Cog6ToothIcon />
          </button>
        </div>
        
        <div className="duck-image-container">
          <img src="/duckie.png" alt="Rubber Duck" className="duck-image" />
          <h1>Kwaak!</h1>
        </div>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role} ${message.isStreaming ? 'streaming' : ''}`}
            >
              {message.content}
              {message.isStreaming && <span className="typing-indicator">▊</span>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isTyping && sendMessage()}
            placeholder={isTyping ? "Kwaak is thinking..." : "Tell me what's on your mind..."}
            className="message-input"
            disabled={isTyping}
          />
          <button 
            onClick={sendMessage} 
            className="send-button"
            disabled={isTyping}
          >
            <PaperAirplaneIcon className="h-6 w-6" />
            <span>Ask Kwaak</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
