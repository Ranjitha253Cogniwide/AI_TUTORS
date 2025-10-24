import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
 
export default function ChatBot() {
  const [mode, setMode] = useState('tutor');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('english');
  const [chapter, setChapter] = useState([]);
  const messagesEndRef = useRef(null);
  const [showChapters, setShowChapters] = useState(true);

  const getStarter = (mode) => {
    return mode === 'tutor'
      ? "Hey there! Ready to learn something cool today? Ask me anything!"
      : `Hey there! How was the ${subject}  class ? Ready for a quick assessment?`;
  };
  const [messages, setMessages] = useState([{ role: 'assistant', content: getStarter(mode), images: [] }]);

  useEffect(() => {
  setMessages([{ role: 'assistant', content: getStarter(mode), images: [] }]);
  setShowChapters(true);

  if (mode === 'tutor') {
    // Tutor logic (same as before)
    initialMessage(subject);
  } else if (mode === 'assessment') {
    fetch(`http://127.0.0.1:8000/assessment/get-initial-response/${subject}`)
      .then(res => res.json())
      .then(data => {
        if (data?.response) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: data.response, images: [] }
          ]);
        }
      })
      .catch(err => console.error('Assessment init error:', err));
  } else {
    setChapter([]);
  }
}, [subject, mode]);

 
  const API_URL = mode === 'tutor'
    ? 'http://127.0.0.1:8000/tutor/ask'
    : 'http://127.0.0.1:8000/assessment/query';
 
  const initialMessage = async (subject) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/tutor/get-initial-response/${subject}`);
      const data = await response.json();
 
      if (data?.response && data.response !== getStarter('tutor')) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
 
      let chaptersData = data?.data || [];
 
      // Transform English data to have 'chapters' array
      if (subject === 'english') {
        const unitsMap = {};
        chaptersData.forEach(item => {
          const unitKey = item.Unit_Name || `Unit ${item.Unit_No}`;
          if (!unitsMap[unitKey]) unitsMap[unitKey] = { unit: unitKey, chapters: [] };
          unitsMap[unitKey].chapters.push({ title: item.Lesson_Name });
        });
        chaptersData = Object.values(unitsMap);
      }
 
      setChapter(chaptersData);
      console.log('Chapters:', chaptersData);
 
    } catch (error) {
      console.error('Error fetching initial message:', error);
    }
  };
 
  const [sessionId] = useState(() => {
    let existing = typeof window !== 'undefined' ? Math.random().toString(36).substr(2, 9) : 'demo';
    return existing;
  });
 
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);
 
  const sendMessage = async (text) => {
    const messageText = (typeof text === 'string' && text.trim()) ? text.trim() : input.trim();
    if (!messageText || isLoading) return;
 
    setShowChapters(false);
 
    setMessages(prev => [...prev, { role: 'user', content: messageText, images: [] }]);
    setInput('');
    setIsLoading(true);
 
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question: messageText, subject: subject }),
      });
 
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Network error');
      }
 
      const data = await res.json();
      const images = Array.isArray(data.images) ? data.images : [];
 
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response.replace(/<\/?strong>/g, '')
          .replace(
            /<hint>\s*(.*?)\s*<\/hint>/gs,
            `<div style="background-color:#e6f3ff; padding:8px; border-radius:8px; font-style: italic;">$1</div>`
          ),
        images: images,
        type: data.type,
      }]);
 
      if (data.type === 'cleared') {
        setMessages([{ role: 'assistant', content: getStarter(mode), images: [] }]);
        setShowChapters(true);
        if (mode === 'tutor') {
          initialMessage(subject);
        }
      }
    } catch (err) {
      console.error('Send error', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops — could not reach the server. Try again.', images: [] }]);
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) sendMessage();
    }
  };
 
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full blur-md opacity-40 animate-pulse"></div>
              <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-full border-2 border-white/30">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">Student AI Tutor</h2>
              <p className="text-sm text-white/90 font-light">Your personal learning assistant</p>
            </div>
          </div>
 
 
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 shadow-lg hover:bg-white/30 text-sm font-medium cursor-pointer"
          >
            <option value="tutor" className="bg-purple-600 text-white">🎓 AI Tutor</option>
            <option value="assessment" className="bg-purple-600 text-white">🧠 AI Assessment</option>
          </select>
 
          <div className="flex items-center gap-2">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 shadow-lg hover:bg-white/30 text-sm font-medium cursor-pointer"
            >
              <option value="english" className="bg-purple-600 text-white">📚 English</option>
              <option value="maths" className="bg-purple-600 text-white">🔢 Mathematics</option>
            </select>
            <button onClick={() => sendMessage('clear')} className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 shadow-lg hover:bg-white/30 text-sm font-medium cursor-pointer">clear</button>
          </div>
        </div>
      </div>
 
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col gap-2 animate-slideIn ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="relative flex-shrink-0">
                <div className={`absolute inset-0 rounded-full blur-lg opacity-20 ${msg.role === 'user' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                <div className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                  {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
                </div>
              </div>
 
              <div className={`relative group ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 ${msg.role === 'user' ? 'bg-blue-100' : msg.type === 'answer' ? 'bg-yellow-100' : 'bg-purple-100'}`}></div>
<div className={`relative rounded-3xl px-6 py-4 shadow-lg backdrop-blur-lg transition-all duration-300 group-hover:shadow-2xl
  ${msg.role === 'user'
    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white border border-white/20'
    : msg.type === 'answer'
      ? 'bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 text-gray-800 border-2 border-yellow-300 shadow-lg'
      : 'bg-white/90 text-gray-800 border border-purple-100'
  }`}
>
  {msg.type === 'answer' && (
    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md animate-bounce-slow">
      ✨
    </div>
  )}
 
                  <div className="whitespace-pre-wrap break-words leading-relaxed text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: msg.content }} />
                </div>
              </div>
            </div>
          </div>
        ))}
 
        {/* Chapters */}
        {mode === 'tutor' && showChapters && Array.isArray(chapter) && chapter.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {chapter.every(item => item && 'title' in item && !('chapters' in item)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {chapter.map((item, idx) => (
                  <button key={idx} onClick={() => sendMessage(item.title)} className="px-4 py-2 bg-purple-200 text-purple-800 rounded-full hover:bg-purple-300 transition-colors">{item.title}</button>
                ))}
              </div>
            ) : (
              chapter.map((unit, unitIdx) => (
                <div key={unitIdx}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{unit.unit}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.isArray(unit.chapters) && unit.chapters.length > 0 ? (
                      unit.chapters.map((item, idx) => (
                        <button key={idx} onClick={() => sendMessage(item.title)} className="px-4 py-2 bg-purple-200 text-purple-800 rounded-full hover:bg-purple-300 transition-colors">{item.title}</button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No chapters available</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
 
        {/* Loading */}
        {isLoading && (
          <div className="flex gap-3 items-start animate-slideIn">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full blur-lg bg-purple-400 opacity-50"></div>
              <div className="relative w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-6 py-4 shadow-lg border border-purple-100">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce"></span>
                <span className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          </div>
        )}
 
        <div ref={messagesEndRef} />
      </div>
 
      {/* Input */}
      <div className="relative p-4 bg-white/80 backdrop-blur-xl border-t border-purple-100 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-50"></div>
        <div className="relative flex gap-2">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              rows={1}
              className="relative w-full px-5 py-3 text-sm rounded-2xl bg-white text-gray-800 border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none transition-all duration-300 shadow-md hover:shadow-lg placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="relative group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-3 rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl disabled:hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-white rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <Send className="relative w-5 h-5" />
          </button>
        </div>
      </div>
 
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
 
        @keyframes bounce-slow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
 
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(139, 92, 246, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #a78bfa, #ec4899); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #8b5cf6, #db2777); }
      `}</style>
    </div>
  );
}