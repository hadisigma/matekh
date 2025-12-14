const { useState, useEffect, useRef } = React;
const { Menu, Plus, MessageSquare, LogOut, Image, Send, Loader2 } = lucide;

const MatEKH = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [lastResetTime, setLastResetTime] = useState(Date.now());
  const messagesEndRef = useRef(null);

  const MAX_FREE_MESSAGES = 10;
  const RESET_INTERVAL = 60 * 60 * 1000;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const checkGuestTimer = () => {
      const now = Date.now();
      if (now - lastResetTime >= RESET_INTERVAL) {
        setGuestMessageCount(0);
        setLastResetTime(now);
      }
    };

    if (isLoggedIn === false) {
      const interval = setInterval(checkGuestTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, lastResetTime]);

  useEffect(() => {
    const loadChats = () => {
      const stored = localStorage.getItem('matekh_chats');
      if (stored) {
        setChats(JSON.parse(stored));
      }
    };
    if (isLoggedIn === true) loadChats();
  }, [isLoggedIn]);

  const handleLogin = () => {
    if (username === 'erikkaremhadi' && password === 'erik123karem123hadi123') {
      setIsLoggedIn(true);
      setIsAdmin(true);
      setMessageCount(Infinity);
    } else if (username && password) {
      setIsLoggedIn(true);
      setIsAdmin(false);
      setMessageCount(0);
    }
  };

  const handleGuestMode = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setGuestMessageCount(0);
    setLastResetTime(Date.now());
  };

  const handleLogout = () => {
    setIsLoggedIn(null);
    setIsAdmin(false);
    setUsername('');
    setPassword('');
    setChats([]);
    setCurrentChatId(null);
    setMessages([]);
    setMessageCount(0);
    setGuestMessageCount(0);
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: `Neuer Chat ${chats.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    localStorage.setItem('matekh_chats', JSON.stringify(updatedChats));
    setCurrentChatId(newChat.id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const loadChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      setSidebarOpen(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (isLoggedIn === false) {
      if (guestMessageCount >= MAX_FREE_MESSAGES) {
        alert(`⏰ Du hast dein Limit von ${MAX_FREE_MESSAGES} Nachrichten pro Stunde erreicht!\n\nMelde dich an für unbegrenzten Zugang oder warte bis zur nächsten Stunde.`);
        return;
      }
    } else if (isLoggedIn === true && !isAdmin) {
      if (messageCount >= MAX_FREE_MESSAGES) {
        alert('Du hast dein Chat-Limit erreicht! Melde dich als Admin an für unbegrenzten Zugang.');
        return;
      }
    }

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    
    if (isLoggedIn === false) {
      setGuestMessageCount(guestMessageCount + 1);
    } else if (isLoggedIn === true && !isAdmin) {
      setMessageCount(messageCount + 1);
    }

    try {
      const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer hf_DEIN_TOKEN_HIER'
        },
        body: JSON.stringify({
          inputs: input,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });

      const data = await response.json();
      const aiMessage = {
        role: 'assistant',
        content: data[0]?.generated_text || 'Entschuldigung, es gab einen Fehler.'
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      if (currentChatId && isLoggedIn === true) {
        const chatIndex = chats.findIndex(c => c.id === currentChatId);
        const updatedChat = {
          ...chats[chatIndex],
          messages: finalMessages,
          title: finalMessages[0]?.content.slice(0, 30) || 'Neuer Chat'
        };
        const newChats = [...chats];
        newChats[chatIndex] = updatedChat;
        setChats(newChats);
        localStorage.setItem('matekh_chats', JSON.stringify(newChats));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = {
        role: 'assistant',
        content: '🤖 Demo-Antwort: Hallo! Ich bin MatEKH. In der Live-Version würde ich eine echte KI-Antwort geben. Für eine funktionierende Version benötigst du einen API-Key von Hugging Face.'
      };
      setMessages([...updatedMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim() || isLoading) return;
    setIsLoading(true);
    
    try {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&nologo=true`;
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Image generation error:', error);
      alert('Fehler bei der Bildgenerierung');
    } finally {
      setIsLoading(false);
    }
  };

  const getRemainingTime = () => {
    const elapsed = Date.now() - lastResetTime;
    const remaining = RESET_INTERVAL - elapsed;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoggedIn === null) {
    return React.createElement('div', { className: 'min-h-screen bg-white flex items-center justify-center' },
      React.createElement('div', { className: 'bg-white p-8 rounded-lg shadow-lg w-96' },
        React.createElement('h1', { className: 'text-3xl font-bold text-center mb-6 text-gray-800' }, 'MatEKH'),
        React.createElement('div', { className: 'mb-6' },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Benutzername',
            value: username,
            onChange: (e) => setUsername(e.target.value),
            className: 'w-full p-3 mb-4 border border-gray-300 rounded-lg'
          }),
          React.createElement('input', {
            type: 'password',
            placeholder: 'Passwort',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            onKeyPress: (e) => e.key === 'Enter' && handleLogin(),
            className: 'w-full p-3 mb-4 border border-gray-300 rounded-lg'
          }),
          React.createElement('button', {
            onClick: handleLogin,
            className: 'w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition mb-3'
          }, 'Anmelden')
        ),
        React.createElement('div', { className: 'relative' },
          React.createElement('div', { className: 'absolute inset-0 flex items-center' },
            React.createElement('div', { className: 'w-full border-t border-gray-300' })
          ),
          React.createElement('div', { className: 'relative flex justify-center text-sm' },
            React.createElement('span', { className: 'px-2 bg-white text-gray-500' }, 'oder')
          )
        ),
        React.createElement('button', {
          onClick: handleGuestMode,
          className: 'w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition mt-4'
        }, 'Abgemeldet bleiben'),
        React.createElement('p', { className: 'text-xs text-center mt-2 text-gray-600' },
          `Als Gast: ${MAX_FREE_MESSAGES} Nachrichten pro Stunde`
        ),
        React.createElement('p', { className: 'text-xs text-center mt-6 text-gray-500' }, 
          'Erstellt von Erik, Karem und Hadi'
        )
      )
    );
  }

  return React.createElement('div', { className: 'flex h-screen bg-white' },
    React.createElement('div', { 
      className: `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative lg:translate-x-0 w-64 bg-gray-900 text-white h-full transition-transform z-20` 
    },
      React.createElement('div', { className: 'p-4 border-b border-gray-700' },
        isLoggedIn === true && React.createElement('button', {
          onClick: createNewChat,
          className: 'w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition'
        },
          React.createElement(Plus, { size: 20 }),
          React.createElement('span', null, 'Neuer Chat')
        )
      ),
      React.createElement('div', { className: 'overflow-y-auto h-[calc(100vh-200px)]' },
        isLoggedIn === true && chats.map((chat) =>
          React.createElement('button', {
            key: chat.id,
            onClick: () => loadChat(chat.id),
            className: `w-full text-left p-4 hover:bg-gray-800 transition flex items-center gap-2 ${currentChatId === chat.id ? 'bg-gray-800' : ''}`
          },
            React.createElement(MessageSquare, { size: 16 }),
            React.createElement('span', { className: 'truncate' }, chat.title)
          )
        ),
        isLoggedIn === false && React.createElement('div', { className: 'p-4 text-sm text-gray-400' },
          React.createElement('p', null, '🚀 Melde dich an um Chats zu speichern!')
        )
      ),
      React.createElement('div', { className: 'absolute bottom-0 w-64 border-t border-gray-700' },
        isAdmin && React.createElement('button', {
          onClick: () => setShowImageGen(!showImageGen),
          className: 'w-full p-4 hover:bg-gray-800 transition flex items-center gap-2'
        },
          React.createElement(Image, { size: 20 }),
          React.createElement('span', null, 'Bildgenerierung')
        ),
        React.createElement('button', {
          onClick: handleLogout,
          className: 'w-full p-4 hover:bg-gray-800 transition flex items-center gap-2'
        },
          React.createElement(LogOut, { size: 20 }),
          React.createElement('span', null, isLoggedIn === true ? 'Abmelden' : 'Zurück zum Login')
        )
      )
    ),
    React.createElement('div', { className: 'flex-1 flex flex-col' },
      React.createElement('div', { className: 'bg-white border-b border-gray-200 p-4 flex items-center justify-between' },
        React.createElement('button', {
          onClick: () => setSidebarOpen(!sidebarOpen),
          className: 'lg:hidden p-2 hover:bg-gray-100 rounded'
        },
          React.createElement(Menu, { size: 24 })
        ),
        React.createElement('h1', { className: 'text-xl font-bold text-gray-800' }, 'MatEKH'),
        React.createElement('div', { className: 'text-sm text-gray-600' },
          isAdmin ? '∞ Messages' :
          isLoggedIn === false ? 
            React.createElement('div', { className: 'text-right' },
              React.createElement('div', null, `${guestMessageCount}/${MAX_FREE_MESSAGES}`),
              React.createElement('div', { className: 'text-xs text-gray-500' }, `Reset: ${getRemainingTime()}`)
            ) :
            `${messageCount}/${MAX_FREE_MESSAGES}`
        )
      ),
      showImageGen && isAdmin ?
        React.createElement('div', { className: 'flex-1 p-6 overflow-y-auto' },
          React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Bildgenerierung'),
          React.createElement('div', { className: 'flex gap-2 mb-4' },
            React.createElement('input', {
              type: 'text',
              value: imagePrompt,
              onChange: (e) => setImagePrompt(e.target.value),
              placeholder: 'Beschreibe dein Bild...',
              className: 'flex-1 p-3 border border-gray-300 rounded-lg'
            }),
            React.createElement('button', {
              onClick: generateImage,
              disabled: isLoading,
              className: 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50'
            }, isLoading ? React.createElement(Loader2, { className: 'animate-spin' }) : 'Generieren')
          ),
          generatedImage && React.createElement('img', {
            src: generatedImage,
            alt: 'Generated',
            className: 'max-w-full rounded-lg shadow-lg'
          })
        ) :
        React.createElement(React.Fragment, null,
          React.createElement('div', { className: 'flex-1 p-6 overflow-y-auto' },
            messages.length === 0 ?
              React.createElement('div', { className: 'text-center text-gray-500 mt-20' },
                React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'MatEKH KI'),
                React.createElement('p', null, 'Starte eine Unterhaltung'),
                isLoggedIn === false && React.createElement('div', { className: 'mt-4 p-4 bg-blue-50 rounded-lg inline-block' },
                  React.createElement('p', { className: 'text-sm text-blue-800' },
                    `🎉 Gast-Modus: ${MAX_FREE_MESSAGES} Nachrichten pro Stunde kostenlos!`
                  )
                )
              ) :
              messages.map((msg, idx) =>
                React.createElement('div', {
                  key: idx,
                  className: `mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`
                },
                  React.createElement('div', {
                    className: `inline-block p-4 rounded-lg max-w-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`
                  }, msg.content)
                )
              ),
            isLoading && React.createElement('div', { className: 'text-left mb-4' },
              React.createElement('div', { className: 'inline-block p-4 rounded-lg bg-gray-100' },
                React.createElement('div', { className: 'animate-spin' }, '⏳')
              )
            ),
            React.createElement('div', { ref: messagesEndRef })
          ),
          React.createElement('div', { className: 'border-t border-gray-200 p-4' },
            React.createElement('div', { className: 'flex gap-2' },
              React.createElement('input', {
                type: 'text',
                value: input,
                onChange: (e) => setInput(e.target.value),
                onKeyPress: (e) => e.key === 'Enter' && sendMessage(),
                placeholder: 'Nachricht schreiben...',
                className: 'flex-1 p-3 border border-gray-300 rounded-lg'
              }),
              React.createElement('button', {
                onClick: sendMessage,
                disabled: isLoading,
                className: 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50'
              }, React.createElement(Send, { size: 20 }))
            ),
            React.createElement('p', { className: 'text-xs text-center mt-2 text-gray-500' }, 
              'Erstellt von Erik, Karem und Hadi'
            )
          )
        )
    )
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(MatEKH));
