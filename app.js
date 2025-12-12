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
      'Authorization': 'Bearer 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'  // ← DEIN TOKEN HIER EINFÜGEN!
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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">MatEKH</h1>
          
          <div className="mb-6">
            <input
              type="text"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition mb-3"
            >
              Anmelden
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">oder</span>
            </div>
          </div>

          <button
            onClick={handleGuestMode}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition mt-4"
          >
            Abgemeldet bleiben
          </button>
          <p className="text-xs text-center mt-2 text-gray-600">
            Als Gast: {MAX_FREE_MESSAGES} Nachrichten pro Stunde
          </p>

          <p className="text-xs text-center mt-6 text-gray-500">Erstellt von Erik, Karem und Hadi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative lg:translate-x-0 w-64 bg-gray-900 text-white h-full transition-transform z-20`}>
        <div className="p-4 border-b border-gray-700">
          {isLoggedIn === true && (
            <button
              onClick={createNewChat}
              className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition"
            >
              <Plus size={20} />
              <span>Neuer Chat</span>
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-200px)]">
          {isLoggedIn === true && chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`w-full text-left p-4 hover:bg-gray-800 transition flex items-center gap-2 ${
                currentChatId === chat.id ? 'bg-gray-800' : ''
              }`}
            >
              <MessageSquare size={16} />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}
          {isLoggedIn === false && (
            <div className="p-4 text-sm text-gray-400">
              <p>🚀 Melde dich an um Chats zu speichern!</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 w-64 border-t border-gray-700">
          {isAdmin && (
            <button
              onClick={() => setShowImageGen(!showImageGen)}
              className="w-full p-4 hover:bg-gray-800 transition flex items-center gap-2"
            >
              <Image size={20} />
              <span>Bildgenerierung</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full p-4 hover:bg-gray-800 transition flex items-center gap-2"
          >
            <LogOut size={20} />
            <span>{isLoggedIn === true ? 'Abmelden' : 'Zurück zum Login'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">MatEKH</h1>
          <div className="text-sm text-gray-600">
            {isAdmin ? (
              '∞ Messages'
            ) : isLoggedIn === false ? (
              <div className="text-right">
                <div>{guestMessageCount}/{MAX_FREE_MESSAGES}</div>
                <div className="text-xs text-gray-500">Reset: {getRemainingTime()}</div>
              </div>
            ) : (
              `${messageCount}/${MAX_FREE_MESSAGES}`
            )}
          </div>
        </div>

        {showImageGen && isAdmin ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Bildgenerierung</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Beschreibe dein Bild..."
                className="flex-1 p-3 border border-gray-300 rounded-lg"
              />
              <button
                onClick={generateImage}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? React.createElement(Loader2, { className: "animate-spin" }) : 'Generieren'}
              </button>
            </div>
            {generatedImage && (
              <img src={generatedImage} alt="Generated" className="max-w-full rounded-lg shadow-lg" />
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 p-6 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <h2 className="text-2xl font-bold mb-2">MatEKH KI</h2>
                  <p>Starte eine Unterhaltung</p>
                  {isLoggedIn === false && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
                      <p className="text-sm text-blue-800">
                        🎉 Gast-Modus: {MAX_FREE_MESSAGES} Nachrichten pro Stunde kostenlos!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-4 rounded-lg max-w-xl ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="text-left mb-4">
                  <div className="inline-block p-4 rounded-lg bg-gray-100">
                    <div className="animate-spin">⏳</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-center mt-2 text-gray-500">Erstellt von Erik, Karem und Hadi</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(MatEKH));
