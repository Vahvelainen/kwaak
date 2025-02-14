import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, KeyIcon } from '@heroicons/react/24/solid'
import Anthropic from '@anthropic-ai/sdk'
import './App.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  useEffect(() => {
    const storedApiKey = localStorage.getItem('claude-api-key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    } else {
      setShowApiKeyInput(true)
    }
  }, [])

  const saveApiKey = () => {
    localStorage.setItem('claude-api-key', apiKey)
    setShowApiKeyInput(false)
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: input }
    ]
    setMessages(newMessages)
    setInput('')

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
        }))
      });

      if (response.content[0].type === 'text') {
        setMessages([...newMessages, { role: 'assistant', content: response.content[0].text }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Kwaak! I can only respond with text!' }])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages([...newMessages, { role: 'assistant', content: 'Kwaak! Something went wrong! (Error communicating with the API)' }])
    }
  }

  if (showApiKeyInput) {
    return (
      <div className="api-key-modal">
        <div className="api-key-form">
          <h1>Welcome to Kwaak!</h1>
          <div className="input-group">
            <label>Enter your Claude API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="api-key-input"
              placeholder="sk-..."
            />
          </div>
          <button onClick={saveApiKey} className="save-key-button">
            Save API Key
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="header">
          <h1>Kwaak!</h1>
          <button onClick={() => setShowApiKeyInput(true)} className="api-key-button">
            <KeyIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="duck-image-container">
          <img src="/duckie.png" alt="Rubber Duck" className="duck-image" />
        </div>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Tell me what's on your mind..."
            className="message-input"
          />
          <button onClick={sendMessage} className="send-button">
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
