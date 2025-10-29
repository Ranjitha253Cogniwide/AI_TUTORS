// // src/chatbot.jsx
// import React, {
//   useState,
//   useRef,
//   useEffect,
//   useCallback,
//   useMemo,
// } from 'react';
// import {
//   Send,
//   User,
//   Sparkles,
//   Info,
//   Mic,
//   MicOff,
//   Volume2,
// } from 'lucide-react';
// import { useSpeechSynthesis } from 'tts-react'; // Import tts-react
// /* --------------------------------------------------------------- */
// /*  Helper – Web Speech API (STT + TTS) – pure JS                 */
// /* --------------------------------------------------------------- */
// const useSpeech = () => {
//   // ---- Speech Recognition (STT) ----
//   const SpeechRecognition =
//     // @ts-ignore  (safe – we only use it when it exists)
//     window.SpeechRecognition || window.webkitSpeechRecognition;

//   const recognition = useMemo(() => {
//     if (!SpeechRecognition) return null;
//     const r = new SpeechRecognition();
//     r.lang = 'en-IN';
//     r.continuous = false;
//     r.interimResults = false;
//     return r;
//   }, [SpeechRecognition]);

//   // ---- Speech Synthesis (TTS) ----
//   const synth = window.speechSynthesis;

//   const speak = useCallback(
//     (text) => {
//       if (!synth) return;
//       synth.cancel();
//       const utter = new SpeechSynthesisUtterance(text);
//       utter.lang = 'en-IN';
//       synth.speak(utter);
//     },
//     [synth]
//   );

//   return { recognition, speak };
// };

// /* --------------------------------------------------------------- */
// /*  MAIN COMPONENT                                                */
// /* --------------------------------------------------------------- */
// export default function ChatBot() {

//     const { speak } = useSpeechSynthesis();

//   /* ------------------- Existing state ------------------- */
//   const starter =
//     "Hey there! Ready to learn something cool today? Ask me anything!";
//   const [messages, setMessages] = useState([
//     { role: 'assistant', content: starter, images: [] },
//   ]);

//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [subject, setSubject] = useState('maths');
//   const [chapter, setChapter] = useState([]);
//   const messagesEndRef = useRef(null);
//   const [showChapters, setShowChapters] = useState(true);
//   const [useCustomPrompt, setUseCustomPrompt] = useState(false);
//   const [customPrompt, setCustomPrompt] = useState('');
//   const [selectedModel, setSelectedModel] = useState('azure/gpt-4o-mini');
//   const [showModelInfo, setShowModelInfo] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [prompt, setPrompt] = useState(false);
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [sessionIds, setSessionIds] = useState(null);
//   const [isPdfMode, setIsPdfMode] = useState(false);

//   /* ------------------- NEW SPEECH STATE ------------------- */
//   const { recognition } = useSpeech();
//   const [isListening, setIsListening] = useState(false);
//   const [autoSpeech, setAutoSpeech] = useState(false); // Auto Speech checkbox

//   /* ------------------------------------------------------- */
//   /*  Auto-speak when a new assistant message arrives        */
//   /* ------------------------------------------------------- */
// useEffect(() => {
//     if (!autoSpeech) return;
//     const last = messages[messages.length - 1];
//     if (last && last.role === 'assistant') {
//       const div = document.createElement('div');
//       div.innerHTML = last.content;
//       const plain = div.textContent || div.innerText || '';
//       setTimeout(() => {
//         speak({ text: plain });
//       }, 0);
//     }
//   }, [messages, autoSpeech, speak]);

//   /* ------------------------------------------------------- */
//   /*  Speech-to-Text handling                                 */
//   /* ------------------------------------------------------- */
//   const toggleListening = useCallback(() => {
//     if (!recognition) return;

//     if (isListening) {
//       recognition.stop();
//       setIsListening(false);
//     } else {
//       recognition.start();
//       setIsListening(true);
//     }
//   }, [recognition, isListening]);

//   useEffect(() => {
//     if (!recognition) return;

//     recognition.onresult = (e) => {
//       const transcript = e.results[0][0].transcript;
//       setInput((prev) => prev + ' ' + transcript);
//       setIsListening(false);
//     };

//     recognition.onerror = () => setIsListening(false);
//     recognition.onend = () => setIsListening(false);

//     return () => recognition.abort();
//   }, [recognition]);

//   /* ------------------------------------------------------- */
//   /*  Scroll to bottom                                        */
//   /* ------------------------------------------------------- */
//   const scrollToBottom = () =>
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   useEffect(() => scrollToBottom(), [messages]);

//   /* ------------------- Existing constants ------------------- */
//   const local = true;
//   const API_URL = local
//     ? 'http://localhost:8100'
//     : 'https://schooldigitalised.cogniwide.com/api/sd';

//   const defaultPrompt = `# Math Coach for 7th Grade
// You are an insightful Maths Coach for 7th-grade students.
// ## Goal
// Help students understand math concepts, Don't give direct answers.
// Note: Consider 0 and 1 as numbers not as boolean values.
// ## Teaching Flow
//   1. **Assess prior knowledge:** Ask a question to see what the student knows.
//   2. **Identify doubts:** Understand their difficulty.
//   3. **Guide step-by-step:** Give hints and explanations for conceptual questions.
//     - For basic math (addition, subtraction, multiplication, division), you may give the answer directly.
//   4. **Follow-up:** Share a fun fact, real-world example, or insight if relevant.
//   5. **Check understanding:** Ask if they are ready to answer the main question.
//   ## Rules
//   - Explain the concepts as explaining to a 7th grade student in Indian CBSE Board School.
//   - Already covered classes and topics:
//       1. What topics comprise the syllabus for Class 1 maths in CBSE 2025-26?
//       Some important topics for Class 1 Maths Syllabus 2025-26 include counting, shapes, addition, subtraction, multiplication, data handling and money. All these concepts set a foundation for more complex topics as the child grows up.
//       2.What topics comprise the syllabus for Class 2 maths in CBSE 2025-26?
//       Some important topics for Class 2 Maths Syllabus 2025–26 include counting in groups, 2D and 3D shapes, numbers up to 100, orientations of lines, addition and subtraction, measurement of length, weight, and capacity, multiplication and division, measurement of time, money, and data handling. All these topics help children strengthen their understanding of basic mathematical operations and logical thinking, preparing them for more advanced concepts in higher classes.
//       3.What topics comprise the syllabus for Class 3 maths in CBSE 2025-26?
//       The CBSE Class 3 Maths Syllabus for 2025-26 comprises fourteen chapters , which include foundational topics such as place value (What's in a Name?, House of Hundreds - I & II) , addition and subtraction (Toy Joy, Double Century, Give and Take) , simple division (Raksha Bandhan, Fair Share) , 2D shapes (Fun with Shapes) , and concepts of time and measurement (Vacation with My Nani Maa, Filling and Lifting, Time Goes On). These chapters use engaging, story-based themes like 'The Surajkund Fair' and 'Fun at Class Party!' to introduce mathematical concepts
//       4.What topics comprise the syllabus for Class 4 maths in CBSE 2025-26?
//       The CBSE Class 4 Maths Syllabus for 2025-26 includes fourteen units , covering topics such as geometry and patterns (Shapes Around Us , Hide and Seek , Pattern Around Us , Fun with Symmetry ), large numbers and place value (Thousands Around Us ), division and grouping (Sharing and Measuring , Equal Groups ), measurement of length, weight, and volume (Measuring Length , The Cleanest Village , Weigh it, Pour it ), concepts of time (Ticking Clocks and Turning Calendar ), and the basics of data handling (Data Handling ). The syllabus also integrates math with real-world scenarios in chapters like 'Elephants, Tigers, and Leopards' and 'The Transport Museum'
//       5.What topics comprise the syllabus for Class 5 maths in CBSE 2025-26?
//       The CBSE Class 5 Maths Syllabus for 2025-26 includes fifteen units that cover advanced foundational concepts like Fractions and Angles as Turns, alongside extensive real-world applications of measurement including distance and travel (We the Travellers-I & II, Far and Near), weight and capacity (Weight and Capacity, The Dairy Farm, Coconut Farm), and time (Racing Seconds). The syllabus also reinforces geometry and patterns (Shapes and Patterns, Symmetrical Designs), and culminates with lessons on data handling (Data Through Pictures).
//       6.What topics comprise the syllabus for Class 6 maths in CBSE 2025-26?
//       The CBSE Class 6 Maths Syllabus for 2025-26 is divided into ten core chapters , which introduce key secondary-level mathematical concepts such as Integers (The Other Side of Zero) and operations with Fractions. The syllabus also focuses on Number Theory (Number Play, Prime Time) covering HCF, LCM, and factorisation; Geometry and Mensuration (Lines and Angles, Perimeter and Area, Playing with Constructions) including basic constructions and area formulas; and Data Handling and Presentation. These concepts are strengthened with lessons on Patterns in Mathematics and Symmetry.
//   - Keep explanations simple, friendly, and interactive.
//   - Ask **one question at a time**.
//   - Be patient, encouraging, and adapt to the student's response.
//   - **Never repeat the same question.**
//   - Use human-readable equations (e.g., "2x + 3 = 7") not in LATEX.
//   - Only use the provided CONTEXT (learning materials).
//   - If the answer is not in the CONTEXT, reply: "Hmm, I don’t see that in what I have — could you rephrase or give more detail?"
//   - For conceptual or multi-step problems:
//   - Respond **step-by-step**, never giving full solutions immediately.
//   - If the student answers incorrectly or says "I don't know":
//     <hint>
//     [give a hint related to the last question]
//     </hint>
//   - Once the student understands:
//   - Praise them warmly, e.g., "Great job!"
//   - Ask: "Would you like to explore this topic more, or ask a different question?"
//   - After giving the final answer, ask the student if they want to explore more, else close the conversation.
//   - When explaining math problems, always provide step-by-step solutions with examples. The example should be in a hint tag: <hint>Example: [example]</hint>.
//   - After asking a question, if the student answers incorrectly, correct them gracefully with an example.
// ##IMPORTANT RULE:
//   -If the CONTEXT contains a images/ or diagrams reference like:
//     ![](images/image_name.jpg)
//   -You must convert it into the following HTML image format and include it in the answer:
//     <img src='http://127.0.0.1:8100/app/tutor_assistant/output/images/<image_name>.jpg'>
//   -Do this for each image reference found. Do not omit them. Always include converted image references in the final HTML output.
// CONTEXT: {context}
// ## Response Format
// \`\`\`json
// {{
//   "answer": "[Your response in html format]",
//   "correct_answer": true/false, make it true only user answers correctly then reset it for follow up question.
//   "quick_replies": [Example: 'I understand', 'I don\\'t know','Explain it more','Give me an example','Hinglish mein samjha dijiye'] max it should be 6.
// }}
// \`\`\`
// ## Answer Format
// - The "answer" field must be a string in html format.
// - Use html for structure:
//   - Use \`<b></b>\` for emphasis.
//   - Use paragraphs by having double line breaks.
// - Use the \`<hint>\` tag for hints and examples, but the content inside the tag should be in html.
// Example of a hint in html:
// \`\`\`
// <hint>
// **Example:** To solve 2x + 3 = 7, first subtract 3 from both sides to get 2x = 4.
// </hint>
// \`\`\`
// Remember: You are a math coach for 7th graders. Make it engaging and clear!`;

//   const models = {
//     'azure/gpt-4o-mini': {
//       name: 'GPT-4o Mini (Azure)',
//       contextWindow: '128k tokens',
//       inputCost: '$0.15 / 1M tokens',
//       outputCost: '$0.60 / 1M tokens',
//       costPer: 'per 1M tokens',
//       description: 'Cost efficient multitmodal model with vision support and large context window',
//     },
//     'llama-3.1-8b-instant': {
//       name: 'Llama 3.1 8B Instant',
//       contextWindow: '128k tokens',
//       inputCost: '$0.05',
//       outputCost: '$0.08',
//       costPer: 'per 1M tokens',
//       description: 'Fast and efficient for general tasks',
//     },
//     'openai/gpt-oss-20b': {
//       name: 'GPT OSS 20B',
//       contextWindow: '128k tokens',
//       inputCost: '$0.59',
//       outputCost: '$0.79',
//       costPer: 'per 1M tokens',
//       description: 'Balanced performance and cost',
//     },
//     'qwen/qwen3-32b': {
//       name: 'Qwen3 32B',
//       contextWindow: '131k tokens',
//       inputCost: '$0.35',
//       outputCost: '$0.40',
//       costPer: 'per 1M tokens',
//       description: 'High quality reasoning',
//     },
//   };

//   /* ------------------- Existing effects ------------------- */
//   useEffect(() => {
//     if (!isPdfMode) {
//       sendMessage('clear');
//       initialMessage(subject);
//     }
//   }, [subject]);

//   /* ------------------------------------------------------- */
//   /*  Session ID (random)                                     */
//   /* ------------------------------------------------------- */
//   const [sessionId] = useState(() => {
//     return Math.random().toString(36).substr(2, 9);
//   });

//   /* ------------------------------------------------------- */
//   /*  Helper: convertFractionsToMathML (unchanged)            */
//   /* ------------------------------------------------------- */
//   function convertFractionsToMathML(htmlString) {
//     htmlString = htmlString.replace(/(\d+)\s*\/\s*(\d+)/g, (_, num, den) => {
//       return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
//                 <mfrac><mn>${num}</mn><mn>${den}</mn></mfrac>
//               </math>`;
//     });
//     htmlString = htmlString.replace(
//       /(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)/g,
//       (_, a, b, result) => {
//         return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
//                 <mn>${a}</mn><mo>÷</mo><mn>${b}</mn><mo>=</mo><mn>${result}</mn>
//               </math>`;
//       }
//     );
//     return htmlString;
//   }

//   /* ------------------------------------------------------- */
//   /*  Initial message for a subject                           */
//   /* ------------------------------------------------------- */
//   const initialMessage = async (subject) => {
//     const response = await fetch(`${API_URL}/tutor/get-initial-response/${subject}`);
//     const data = await response.json();
//     setMessages((prev) => [...prev, { role: 'assistant', content: data?.response }]);
//     if (subject === 'english' && Array.isArray(data?.data)) {
//       const grouped = Object.values(
//         data.data.reduce((acc, item) => {
//           if (!acc[item.Unit_Name]) {
//             acc[item.Unit_Name] = { unit: item.Unit_Name, chapters: [] };
//           }
//           acc[item.Unit_Name].chapters.push({
//             title: item.Lesson_Name,
//             grammarTopics: item.Grammar_Topics || [],
//           });
//           return acc;
//         }, {})
//       );
//       setChapter(grouped);
//     } else {
//       setChapter(data?.data || []);
//     }
//   };

//   /* ------------------------------------------------------- */
//   /*  File upload (PDF / assignment)                         */
//   /* ------------------------------------------------------- */
//   const handleUpload = async () => {
//     if (!file) {
//       alert('Please select a file first.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
//       const startRes = await fetch(`${API_URL}/assignment/start-session`, {
//         method: 'POST',
//         body: formData,
//       });
//       if (!startRes.ok) throw new Error('Failed to start session');
//       const startData = await startRes.json();
//       setSessionIds(startData.session_id);
//       setIsPdfMode(true);
//       setShowChapters(false);
//       setChapter([]);
//       if (startData.ai_message) {
//         setMessages([
//           { role: 'user', content: `Uploaded: ${file.name} successfully`, images: [] },
//           { role: 'assistant', content: startData.ai_message, images: [] },
//         ]);
//       } else {
//         setMessages([
//           { role: 'assistant', content: 'Warning: No response received from AI. Please try again.', images: [] },
//         ]);
//       }
//     } catch (error) {
//       console.error('Upload failed:', error);
//       setMessages([
//         { role: 'assistant', content: 'Upload failed. Please check your file and try again.', images: [] },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ------------------------------------------------------- */
//   /*  Send message (core logic)                               */
//   /* ------------------------------------------------------- */
//   const sendMessage = async (text) => {
//     const messageText = (typeof text === 'string' && text.trim())
//       ? text.trim()
//       : input.trim();
//     if (!messageText || isLoading) return;

//     /* ---- PDF mode handling ---- */
//     if (isPdfMode && messageText.toLowerCase() === 'clear') {
//       setMessages([{ role: 'assistant', content: starter, images: [] }]);
//       setIsPdfMode(false);
//       setSessionIds(null);
//       setFile(null);
//       setInput('');
//       setShowChapters(true);
//       initialMessage(subject);
//       return;
//     }

//     if (isPdfMode) {
//       setShowChapters(false);
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.role === 'assistant' ? { ...msg, quick_replies: [] } : msg
//         )
//       );
//       setMessages((prev) => [...prev, { role: 'user', content: messageText, images: [] }]);
//       setInput('');
//       setIsLoading(true);
//       try {
//         const res = await fetch(`${API_URL}/assignment/send-message`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//           body: new URLSearchParams({
//             session_id: sessionIds,
//             student_message: messageText,
//           }),
//         });
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(errText || 'Network error');
//         }
//         const data = await res.json();
//         setMessages((prev) => [
//           ...prev,
//           { role: 'assistant', content: data.ai_message, images: [] },
//         ]);
//       } catch (err) {
//         console.error('Send error', err);
//         setMessages((prev) => [
//           ...prev,
//           { role: 'assistant', content: 'Oops — could not reach the server. Try again.', images: [] },
//         ]);
//       } finally {
//         setIsLoading(false);
//       }
//       return;
//     }

//     /* ---- Normal tutor mode ---- */
//     setShowChapters(false);
//     setMessages((prev) =>
//       prev.map((msg) =>
//         msg.role === 'assistant' ? { ...msg, quick_replies: [] } : msg
//       )
//     );
//     setMessages((prev) => [...prev, { role: 'user', content: messageText, images: [] }]);
//     setInput('');
//     setIsLoading(true);

//     try {
//       const res = await fetch(API_URL + '/tutor/ask', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           session_id: sessionId,
//           question: messageText,
//           subject: subject,
//           prompt: prompt,
//           model: selectedModel,
//           custom_prompt: useCustomPrompt ? customPrompt : defaultPrompt,
//         }),
//       });
//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(errText || 'Network error');
//       }
//       const data = await res.json();

//       const images = Array.isArray(data.images) ? data.images : [];
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: 'assistant',
//           content: convertFractionsToMathML(
//             data.response
//               .replace(/<\/?strong>/g, '')
//               .replace(
//                 /<hint>\s*(.*?)\s*<\/hint>/gs,
//                 `<div style="background-color:#e6f3ff; padding:8px; border-radius:8px; font-style: italic;">$1</div>`
//               )
//               .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
//           ),
//           images: images,
//           type: data.correct_answer,
//           quick_replies: Array.isArray(data.quick_replies) ? data.quick_replies : [],
//           inputTokens: data.input_tokens,
//           outputTokens: data.output_tokens,
//           totalCost: data.total_cost,
//         },
//       ]);

//       if (data.type === 'cleared') {
//         setMessages([{ role: 'assistant', content: starter, images: [] }]);
//         setShowChapters(true);
//       }
//     } catch (err) {
//       console.error('Send error', err);
//       setMessages((prev) => [
//         ...prev,
//         { role: 'assistant', content: 'Oops — could not reach the server. Try again.', images: [] },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   /* ------------------------------------------------------- */
//   /*  Prompt Editor (unchanged)                               */
//   /* ------------------------------------------------------- */
//   function PromptEditor() {
//     const [localPrompt, setLocalPrompt] = useState(customPrompt || defaultPrompt);
//     const handleSave = () => {
//       setCustomPrompt(localPrompt);
//       setUseCustomPrompt(true);
//       setOpen(false);
//     };
//     return (
//       <div
//         className={`fixed top-0 right-0 w-full md:w-[600px] min-h-[80%] bg-gray-100 z-40 transition-transform duration-500 shadow-2xl border-l border-gray-200 ${
//           open ? 'translate-x-0' : 'translate-x-full'
//         }`}
//       >
//         <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white">
//           <h2 className="text-lg font-semibold text-gray-700">Math Coach Prompt</h2>
//           <button
//             onClick={() => setOpen(false)}
//             className="text-gray-500 hover:text-gray-800 transition-colors text-2xl font-bold"
//           >
//             ×
//           </button>
//         </div>
//         <div className="p-4">
//           <textarea
//             value={localPrompt}
//             onChange={(e) => setLocalPrompt(e.target.value)}
//             className="w-full h-[70vh] p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm bg-white shadow-inner text-black"
//           />
//         </div>
//         <div className="flex justify-end gap-3 p-4 border-t border-gray-300 bg-white">
//           <button
//             onClick={() => setOpen(false)}
//             className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 shadow"
//           >
//             Save & Use
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       if (input.trim()) sendMessage();
//     }
//   };

//   /* ------------------------------------------------------- */
//   /*  Render                                                   */
//   /* ------------------------------------------------------- */
//   return (
//     <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
//       {/* ---------- Header ---------- */}
//       <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white shadow-xl">
//         <div className="absolute inset-0 bg-black opacity-10"></div>
//         <div className="relative flex items-center justify-between gap-4">
//           <div className="flex items-center gap-4">
//             <div className="relative">
//               <div className="absolute inset-0 bg-white rounded-full blur-md opacity-40 animate-pulse"></div>
//               <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-full border-2 border-white/30">
//                 <Sparkles className="w-6 h-6" />
//               </div>
//             </div>
//             <div>
//               <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
//                 Student AI Tutor
//               </h2>
//               <p className="text-sm text-white/90 font-light">Your personal learning assistant</p>
//             </div>
//           </div>

//           {/* Upload controls */}
//           <div>
//             <input
//               type="file"
//               id="fileInput"
//               accept=".pdf,.docx,.jpg,.png"
//               style={{ display: 'none' }}
//               onChange={(e) => setFile(e.target.files[0])}
//             />
//             <button
//               onClick={() => document.getElementById('fileInput').click()}
//               className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 shadow-lg hover:bg-white/30 text-sm font-medium cursor-pointer"
//             >
//               Choose File
//             </button>
//             <button
//               onClick={handleUpload}
//               disabled={loading || !file}
//               className="ml-3 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white border-2 border-white/30 transition-all duration-300 shadow-lg text-sm font-medium cursor-pointer disabled:opacity-50"
//             >
//               {loading ? 'Uploading...' : 'Upload'}
//             </button>
//           </div>

//           {/* Subject + controls */}
//           <div className="flex items-center gap-2">
//             <select
//               value={subject}
//               onChange={(e) => setSubject(e.target.value)}
//               className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 shadow-lg hover:bg-white/30 text-sm font-medium cursor-pointer"
//             >
//               <option value="english" className="bg-purple-600 text-white">
//                 English
//               </option>
//               <option value="maths" className="bg-purple-600 text-white">
//                 Mathematics
//               </option>
//             </select>
//             <label className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 text-sm cursor-pointer hover:bg-white/30 transition-all duration-300">
//               <input
//                 type="checkbox"
//                 checked={prompt}
//                 onChange={(e) => setPrompt(!prompt)}
//                 className="w-4 h-4 cursor-pointer"
//               />
//               <span>Use Custom Prompt</span>
//             </label>
//             <button
//               onClick={() => sendMessage('clear')}
//               className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 shadow-lg hover:bg-white/30 text-sm font-medium cursor-pointer"
//             >
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Prompt sidebar */}
//       <PromptEditor />

//       {/* ---------- Messages ---------- */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-4">
//         {messages.map((msg, idx) => (
//           <div
//             key={idx}
//             className={`flex flex-col gap-2 animate-slideIn ${
//               msg.role === 'user' ? 'items-end' : 'items-start'
//             }`}
//           >
//             <div
//               className={`flex gap-3 max-w-[85%] ${
//                 msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
//               }`}
//             >
//               {/* Avatar */}
//               <div className="relative flex-shrink-0">
//                 <div
//                   className={`absolute inset-0 rounded-full blur-lg opacity-20 ${
//                     msg.role === 'user' ? 'bg-blue-400' : 'bg-purple-400'
//                   }`}
//                 ></div>
//                 <div
//                   className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 ${
//                     msg.role === 'user'
//                       ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
//                       : 'bg-gradient-to-br from-purple-500 to-pink-500'
//                   }`}
//                 >
//                   {msg.role === 'user' ? (
//                     <User className="w-6 h-6 text-white" />
//                   ) : (
//                     <Sparkles className="w-6 h-6 text-white" />
//                   )}
//                 </div>
//               </div>

//               {/* Bubble */}
//               <div className={`relative group ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
//                 {msg.role === 'assistant' && msg.type === true && (
//                   <>
//                     <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow z-10">
//                       <span className="text-2xl">Trophy</span>
//                     </div>
//                     <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-md z-10">
//                       <span className="text-lg">Sparkles</span>
//                     </div>
//                   </>
//                 )}
//                 <div
//                   className={`relative rounded-3xl px-6 py-4 shadow-lg backdrop-blur-lg transition-all duration-300 group-hover:shadow-2xl
//                     ${
//                       msg.role === 'user'
//                         ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white border border-white/20'
//                         : msg.type === true
//                         ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 text-gray-800 border-2 border-yellow-300 shadow-xl'
//                         : 'bg-white/90 text-gray-800 border border-purple-100'
//                     }`}
//                 >
//                   {msg.type === true && (
//                     <div
//                       className={`inline-block mb-2 px-3 py-1 rounded-full text-xs font-medium ${
//                         msg.role === 'user'
//                           ? 'bg-white/20 text-white'
//                           : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md'
//                       }`}
//                     >
//                       {msg.type === true ? 'success' : ''}
//                     </div>
//                   )}
//                   <div
//                     className="whitespace-pre-wrap break-words leading-relaxed text-sm sm:text-base"
//                     dangerouslySetInnerHTML={{ __html: msg.content }}
//                   />
//                 </div>

//                 {/* Token info */}
//                 {msg.inputTokens && (
//                   <div className="flex gap-3 py-3">
//                     <small className="bg-green-500 text-black py-1 px-2 rounded-xl">
//                       Input Token : {msg.inputTokens}
//                     </small>
//                     <small className="bg-green-500 text-black py-1 px-2 rounded-xl">
//                       Output Token : {msg.outputTokens}
//                     </small>
//                     <small className="bg-green-500 text-black py-1 px-2 rounded-xl">
//                       Total Cost : {msg.totalCost}
//                     </small>
//                   </div>
//                 )}
//               </div>

//               {/* ---- Manual speaker button (assistant only) ---- */}
//               {msg.role === 'assistant' && (
//                 <button
//           onClick={() => {
//             const div = document.createElement('div');
//             div.innerHTML = msg.content;
//             const plain = div.textContent || div.innerText || '';
//             speak({ text: plain });
//           }}
//           className="mt-2 p-1.5 rounded-full bg-purple-200 hover:bg-purple-300 transition"
//           title="Read aloud"
//         >
//           <Volume2 className="w-4 h-4 text-purple-800" />
//         </button>
//               )}
//             </div>
            

//             {/* Quick replies */}
//             {msg.quick_replies && msg.quick_replies.length > 0 && (
//               <div className="mt-3 flex flex-wrap gap-2">
//                 {msg.quick_replies.map((reply, i) => (
//                   <button
//                     key={i}
//                     onClick={() => sendMessage(reply)}
//                     className="px-4 py-1.5 bg-purple-200 text-purple-800 rounded-full hover:bg-purple-300 transition-all text-sm font-medium"
//                   >
//                     {reply}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}

//         {/* Chapters UI (unchanged) */}
//         <div className="max-w-7xl mx-auto space-y-6">
//           {showChapters && Array.isArray(chapter) && (
//             <>
//               {chapter.every((item) => 'title' in item && !('chapters' in item)) ? (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                   {chapter.map((item, idx) => (
//                     <button
//                       key={idx}
//                       onClick={() => sendMessage(item.title)}
//                       className="px-4 py-2 bg-pink-100 from-purple-100 to-pink-500 text-purple-800 font-medium rounded-full shadow-md hover:shadow-lg hover:from-purple-500 hover:to-pink-600 transition-all duration-300"
//                     >
//                       {item.title}
//                     </button>
//                   ))}
//                 </div>
//               ) : (
//                 chapter.map((unit, unitIdx) => (
//                   <div
//                     key={unitIdx}
//                     className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl shadow-inner"
//                   >
//                     <h3 className="text-xl font-bold text-purple-800 mb-4 border-b-2 border-purple-300 pb-2">
//                       {unit.unit}
//                     </h3>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                       {unit.chapters.map((item, idx) => (
//                         <div
//                           key={idx}
//                           onClick={() =>
//                             sendMessage(
//                               unit.unit +
//                                 ' : ' +
//                                 item.title +
//                                 '\n' +
//                                 'Grammer topics' +
//                                 '\n' +
//                                 item.grammarTopics.join(', ')
//                             )
//                           }
//                           className="cursor-pointer p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:bg-gradient-to-br from-purple-100 to-pink-100 transition-all duration-300"
//                         >
//                           <button className="w-full text-left font-semibold text-purple-700 hover:text-pink-700 transition-colors bg-pink-200">
//                             {item.title}
//                           </button>
//                           <small className="text-blue-500 px-3 py-1">Grammer topics</small>
//                           {item.grammarTopics && item.grammarTopics.length > 0 && (
//                             <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1">
//                               {item.grammarTopics.map((topic, tIdx) => (
//                                 <li key={tIdx} className="hover:text-pink-600 transition-colors">
//                                   {topic}
//                                 </li>
//                               ))}
//                             </ul>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))
//               )}
//             </>
//           )}
//         </div>

//         {/* Loading indicator */}
//         {isLoading && (
//           <div className="flex gap-3 items-start animate-slideIn">
//             <div className="relative flex-shrink-0">
//               <div className="absolute inset-0 rounded-full blur-lg bg-purple-400 opacity-50"></div>
//               <div className="relative w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
//                 <Sparkles className="w-6 h-6 text-white animate-pulse" />
//               </div>
//             </div>
//             <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-6 py-4 shadow-lg border border-purple-100">
//               <div className="flex gap-1.5">
//                 <span className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce"></span>
//                 <span className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
//                 <span className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* ---------- Input Area ---------- */}
//       <div className="relative p-4 bg-white/80 backdrop-blur-xl border-t border-purple-100 shadow-2xl">
//         <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-50"></div>
//         <div className="relative space-y-3">
//           {/* Model selector + info */}
//           <div className="flex items-center gap-2 px-1">
//             <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
//               AI Model:
//             </label>
//             <select
//               value={selectedModel}
//               onChange={(e) => setSelectedModel(e.target.value)}
//               className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
//             >
//               <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (128k)</option>
//               <option value="openai/gpt-oss-20b">GPT OSS 20B (128k)</option>
//               <option value="qwen/qwen3-32b">Qwen3 32B (131k)</option>
//               <option value="azure/gpt-4o-mini">GPT-4o-mini</option>
//             </select>

//             <div className="relative">
//               <button
//                 onClick={() => setShowModelInfo(!showModelInfo)}
//                 className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all duration-300 shadow-sm hover:shadow-md"
//                 title="Model Information"
//               >
//                 <Info className="w-4 h-4" />
//               </button>
//               {showModelInfo && (
//                 <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-purple-200 p-4 z-50 animate-slideIn">
//                   <button
//                     onClick={() => setShowModelInfo(false)}
//                     className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl leading-none w-6 h-6 flex items-center justify-center"
//                   >
//                     ×
//                   </button>
//                   <h4 className="font-bold text-purple-700 mb-3 pr-6 text-sm">
//                     {models[selectedModel].name}
//                   </h4>
//                   <div className="space-y-2 text-xs">
//                     <div className="flex justify-between py-1.5 border-b border-gray-100">
//                       <span className="text-gray-600 font-medium">Context Window:</span>
//                       <span className="font-semibold text-purple-600">
//                         {models[selectedModel].contextWindow}
//                       </span>
//                     </div>
//                     <div className="flex justify-between py-1.5 border-b border-gray-100">
//                       <span className="text-gray-600 font-medium">Input Cost:</span>
//                       <span className="font-semibold text-green-600">
//                         {models[selectedModel].inputCost}
//                       </span>
//                     </div>
//                     <div className="flex justify-between py-1.5 border-b border-gray-100">
//                       <span className="text-gray-600 font-medium">Output Cost:</span>
//                       <span className="font-semibold text-green-600">
//                         {models[selectedModel].outputCost}
//                       </span>
//                     </div>
//                     <div className="pt-1 pb-1">
//                       <span className="text-gray-500 italic">{models[selectedModel].costPer}</span>
//                     </div>
//                     <div className="pt-2 border-t border-gray-100">
//                       <p className="text-gray-600">{models[selectedModel].description}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <button className="text-xs" onClick={() => setOpen(!open)}>
//               Change prompt
//             </button>
//           </div>

//           {/* ---- Auto Speech checkbox ---- */}
//           <div className="flex items-center gap-2 px-1">
//             <input
//               id="autoSpeech"
//               type="checkbox"
//               checked={autoSpeech}
//               onChange={(e) => setAutoSpeech(e.target.checked)}
//               className="w-4 h-4 text-purple-600 rounded focus:ring-purple-400"
//             />
//             <label htmlFor="autoSpeech" className="text-xs text-gray-600">
//               Auto Speech (read every answer)
//             </label>
//           </div>

//           {/* Input + Mic + Send */}
//           <div className="flex gap-2 items-end">
//             <div className="flex-1 relative group">
//               <textarea
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="Ask me anything..."
//                 disabled={isLoading}
//                 rows={1}
//                 className="relative w-full px-5 py-3 text-sm rounded-2xl bg-white text-gray-800 border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none transition-all duration-300 shadow-md hover:shadow-lg placeholder-gray-400"
//               />
//             </div>

//             {/* Microphone (STT) */}
//             {recognition && (
//               <button
//                 onClick={toggleListening}
//                 disabled={isLoading}
//                 className={`p-2 rounded-full transition-all ${
//                   isListening
//                     ? 'bg-red-500 text-white animate-pulse'
//                     : 'bg-purple-200 text-purple-800 hover:bg-purple-300'
//                 }`}
//                 title={isListening ? 'Stop listening' : 'Speak'}
//               >
//                 {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
//               </button>
//             )}

//             {/* Send */}
//             <button
//               onClick={() => sendMessage()}
//               disabled={!input.trim() || isLoading}
//               className="relative group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl disabled:hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
//             >
//               <div className="absolute inset-0 bg-white rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
//               <Send className="relative w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ---------- Animations ---------- */}
//       <style jsx>{`
//         @keyframes slideIn {
//           from {
//             opacity: 0;
//             transform: translateY(20px) scale(0.95);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0) scale(1);
//           }
//         }
//         .animate-slideIn {
//           animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
//         }
//         @keyframes bounce-slow {
//           0%,
//           100% {
//             transform: translateY(0);
//           }
//           50% {
//             transform: translateY(-5px);
//           }
//         }
//         .animate-bounce-slow {
//           animation: bounce-slow 2s ease-in-out infinite;
//         }
//         ::-webkit-scrollbar {
//           width: 8px;
//         }
//         ::-webkit-scrollbar-track {
//           background: rgba(139, 92, 246, 0.1);
//           border-radius: 10px;
//         }
//         ::-webkit-scrollbar-thumb {
//           background: linear-gradient(to bottom, #a78bfa, #ec4899);
//           border-radius: 10px;
//         }
//         ::-webkit-scrollbar-thumb:hover {
//           background: linear-gradient(to bottom, #8b5cf6, #db2777);
//         }
//       `}</style>
//     </div>
//   );
// }

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Mic, MicOff, Volume2, VolumeX, Settings, X, Check, Upload, Copy, CheckCheck } from 'lucide-react';

export default function ChatBot() {
  const starter = "Hey there! Ready to learn something cool today? Ask me anything!";
  const [messages, setMessages] = useState([{ role: 'assistant', content: starter, images: [] }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('maths');
  const [chapter, setChapter] = useState([]);
  const messagesEndRef = useRef(null);
  const [showChapters, setShowChapters] = useState(true);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('azure/gpt-4o-mini');
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // Voice features state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // PDF upload state
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionIds, setSessionIds] = useState(null);
  const [isPdfMode, setIsPdfMode] = useState(false);

  // Copy state
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const generateSessionId = () => {
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('chat_session_id', newId);
    setSessionId(newId);
    console.log(`New session created: ${newId}`);
    return newId;
  };

  const defaultPrompt = `# Math Coach for 7th Grade
      
You are an insightful Maths Coach for 7th-grade students.

## Goal
Help students understand math concepts, Don't give direct answers.

Note: Consider 0 and 1 as numbers not as boolean values.

## Teaching Flow
  1. **Assess prior knowledge:** Ask a question to see what the student knows.
  2. **Identify doubts:** Understand their difficulty.
  3. **Guide step-by-step:** Give hints and explanations for conceptual questions.
    - For basic math (addition, subtraction, multiplication, division), you may give the answer directly.
  4. **Follow-up:** Share a fun fact, real-world example, or insight if relevant.
  5. **Check understanding:** Ask if they are ready to answer the main question.

  ## Rules
  - Explain the concepts as explaining to a 7th grade student in Indian CBSE Board School.
  - Already covered classes and topics:

      1. What topics comprise the syllabus for Class 1 maths in CBSE 2025-26?
      Some important topics for Class 1 Maths Syllabus 2025-26 include counting, shapes, addition, subtraction, multiplication, data handling and money. All these concepts set a foundation for more complex topics as the child grows up.
        
      2.What topics comprise the syllabus for Class 2 maths in CBSE 2025-26?
      Some important topics for Class 2 Maths Syllabus 2025–26 include counting in groups, 2D and 3D shapes, numbers up to 100, orientations of lines, addition and subtraction, measurement of length, weight, and capacity, multiplication and division, measurement of time, money, and data handling. All these topics help children strengthen their understanding of basic mathematical operations and logical thinking, preparing them for more advanced concepts in higher classes.
      
      3.What topics comprise the syllabus for Class 3 maths in CBSE 2025-26?
      The CBSE Class 3 Maths Syllabus for 2025-26 comprises fourteen chapters , which include foundational topics such as place value (What's in a Name?, House of Hundreds - I & II) , addition and subtraction (Toy Joy, Double Century, Give and Take) , simple division (Raksha Bandhan, Fair Share) , 2D shapes (Fun with Shapes) , and concepts of time and measurement (Vacation with My Nani Maa, Filling and Lifting, Time Goes On). These chapters use engaging, story-based themes like 'The Surajkund Fair' and 'Fun at Class Party!' to introduce mathematical concepts

      4.What topics comprise the syllabus for Class 4 maths in CBSE 2025-26?
      The CBSE Class 4 Maths Syllabus for 2025-26 includes fourteen units , covering topics such as geometry and patterns (Shapes Around Us , Hide and Seek , Pattern Around Us , Fun with Symmetry ), large numbers and place value (Thousands Around Us ), division and grouping (Sharing and Measuring , Equal Groups ), measurement of length, weight, and volume (Measuring Length , The Cleanest Village , Weigh it, Pour it ), concepts of time (Ticking Clocks and Turning Calendar ), and the basics of data handling (Data Handling ). The syllabus also integrates math with real-world scenarios in chapters like 'Elephants, Tigers, and Leopards' and 'The Transport Museum'

      5.What topics comprise the syllabus for Class 5 maths in CBSE 2025-26?
      The CBSE Class 5 Maths Syllabus for 2025-26 includes fifteen units that cover advanced foundational concepts like Fractions and Angles as Turns, alongside extensive real-world applications of measurement including distance and travel (We the Travellers-I & II, Far and Near), weight and capacity (Weight and Capacity, The Dairy Farm, Coconut Farm), and time (Racing Seconds). The syllabus also reinforces geometry and patterns (Shapes and Patterns, Symmetrical Designs), and culminates with lessons on data handling (Data Through Pictures).

      6.What topics comprise the syllabus for Class 6 maths in CBSE 2025-26?
      The CBSE Class 6 Maths Syllabus for 2025-26 is divided into ten core chapters , which introduce key secondary-level mathematical concepts such as Integers (The Other Side of Zero) and operations with Fractions. The syllabus also focuses on Number Theory (Number Play, Prime Time) covering HCF, LCM, and factorisation; Geometry and Mensuration (Lines and Angles, Perimeter and Area, Playing with Constructions) including basic constructions and area formulas; and Data Handling and Presentation. These concepts are strengthened with lessons on Patterns in Mathematics and Symmetry.


  - Keep explanations simple, friendly, and interactive.
  - Ask **one question at a time**.
  - Be patient, encouraging, and adapt to the student's response.
  - **Never repeat the same question.**
  - Use human-readable equations (e.g., "2x + 3 = 7") not in LATEX.
  - Only use the provided CONTEXT (learning materials).
  - If the answer is not in the CONTEXT, reply: "Hmm, I don’t see that in what I have — could you rephrase or give more detail?"
  - For conceptual or multi-step problems:
  - Respond **step-by-step**, never giving full solutions immediately.
  - If the student answers incorrectly or says "I don't know":
    <hint>
    [give a hint related to the last question]
    </hint>
  - Once the student understands:
  - Praise them warmly, e.g., "Great job!"
  - Ask: "Would you like to explore this topic more, or ask a different question?"
  - After giving the final answer, ask the student if they want to explore more, else close the conversation.
  - When explaining math problems, always provide step-by-step solutions with examples. The example should be in a hint tag: <hint>Example: [example]</hint>.
  - After asking a question, if the student answers incorrectly, correct them gracefully with an example.

##IMPORTANT RULE:
  -If the CONTEXT contains a images/ or diagrams reference like:
    ![](images/image_name.jpg)
  -You must convert it into the following HTML image format and include it in the answer:
    <img src='http://127.0.0.1:8100/app/tutor_assistant/output/images/<image_name>.jpg'>
  -Do this for each image reference found. Do not omit them. Always include converted image references in the final HTML output.

CONTEXT: {context}
 
## Response Format
\`\`\`json
{{
  "answer": "[Your response in html format]",
  "correct_answer": true/false, make it true only user answers correctly then reset it for follow up question.
  "quick_replies": [Example: 'I understand', 'I don\\'t know','Explain it more','Give me an example','Hinglish mein samjha dijiye'] max it should be 6.
}}
\`\`\`

## Answer Format
- The "answer" field must be a string in html format.
- Use html for structure:
  - Use \`<b></b>\` for emphasis.
  - Use paragraphs by having double line breaks.
- Use the \`<hint>\` tag for hints and examples, but the content inside the tag should be in html.
Example of a hint in html:
\`\`\`
<hint>
**Example:** To solve 2x + 3 = 7, first subtract 3 from both sides to get 2x = 4.
</hint>
\`\`\`

Remember: You are a math coach for 7th graders. Make it engaging and clear!`;

  const models = {
    'azure/gpt-4o-mini': {
      name: 'GPT-4o Mini (Azure)',
      contextWindow: '128k tokens', 
      inputCost: '$0.15 / 1M tokens',           
      outputCost: '$0.60 / 1M tokens',          
      costPer: 'per 1M tokens',
      description: 'Cost efficient multimodal model with vision support and large context window'
    },
    'llama-3.1-8b-instant': {
      name: 'Llama 3.1 8B Instant',
      contextWindow: '128k tokens',
      inputCost: '$0.05',
      outputCost: '$0.08',
      costPer: 'per 1M tokens',
      description: 'Fast and efficient for general tasks'
    },
    'openai/gpt-oss-20b': {
      name: 'GPT OSS 20B',
      contextWindow: '128k tokens',
      inputCost: '$0.59',
      outputCost: '$0.79',
      costPer: 'per 1M tokens',
      description: 'Balanced performance and cost'
    },
    'qwen/qwen3-32b': {
      name: 'Qwen3 32B',
      contextWindow: '131k tokens',
      inputCost: '$0.35',
      outputCost: '$0.40',
      costPer: 'per 1M tokens',
      description: 'High quality reasoning'
    },
  };

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

 const speakText = (text, messageId) => {
  if (!synthesisRef.current) {
    alert('Speech synthesis is not supported in your browser');
    return;
  }

  if (isSpeaking && speakingMessageId === messageId) {
    synthesisRef.current.cancel();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    return;
  }

  synthesisRef.current.cancel();
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // 👇 Load available voices and pick Samantha if present
  const voices = synthesisRef.current.getVoices();
  const samanthaVoice = voices.find(v => v.name.toLowerCase().includes('samantha'));

  if (samanthaVoice) {
    utterance.voice = samanthaVoice;
  } else {
    console.warn('Samantha voice not found. Using default voice.');
  }

  utterance.onstart = () => {
    setIsSpeaking(true);
    setSpeakingMessageId(messageId);
  };
  utterance.onend = () => {
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };
  utterance.onerror = () => {
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  // Some browsers (especially Chrome) load voices asynchronously
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const newVoices = window.speechSynthesis.getVoices();
      const samantha = newVoices.find(v => v.name.toLowerCase().includes('samantha'));
      if (samantha) utterance.voice = samantha;
      synthesisRef.current.speak(utterance);
    };
  } else {
    synthesisRef.current.speak(utterance);
  }
};


  const copyMessage = (text, messageId) => {
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  useEffect(() => {
    if (!isPdfMode) {
      sendMessage('clear');
      initialMessage(subject);
    }
  }, [subject]);

  const local = false;
  const API_URL = local ? 'http://localhost:8100' : 'https://schooldigitalised.cogniwide.com/api/sd';

  const initialMessage = async (subject) => {
    const response = await fetch(`${API_URL}/tutor/get-initial-response/${subject}`);
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data?.response }]);
    
    if (subject === 'english' && Array.isArray(data?.data)) {
      const grouped = Object.values(
        data.data.reduce((acc, item) => {
          if (!acc[item.Unit_Name]) {
            acc[item.Unit_Name] = {
              unit: item.Unit_Name,
              chapters: [],
            };
          }
          acc[item.Unit_Name].chapters.push({
            title: item.Lesson_Name,
            grammarTopics: item.Grammar_Topics || [],
          });
          return acc;
        }, {})
      );
      setChapter(grouped);
    } else {
      setChapter(data?.data || []);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    let savedId = sessionStorage.getItem("chat_session_id");

    if (!savedId || savedId.trim() === "undefined" || savedId.trim() === "null") {
      savedId = generateSessionId();
    } else {
      setSessionId(savedId);
      console.log(`Existing session loaded: ${savedId}`);
    }
  }, []);

  const handleResetChat = () => {
    sessionStorage.removeItem("chat_session_id");
    const newId = generateSessionId();
    setMessages([{ role: "assistant", content: starter, images: [] }]);
    console.log(`Chat reset — new session started: ${newId}`);
  };

  function convertFractionsToMathML(htmlString) {
    htmlString = htmlString.replace(/(\d+)\s*\/\s*(\d+)/g, (_, num, den) => {
      return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
                <mfrac><mn>${num}</mn><mn>${den}</mn></mfrac>
              </math>`;
    });

    htmlString = htmlString.replace(/(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)/g, (_, a, b, result) => {
      return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
                <mn>${a}</mn><mo>÷</mo><mn>${b}</mn><mo>=</mo><mn>${result}</mn>
              </math>`;
    });

    return htmlString;
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const startRes = await fetch(`${API_URL}/assignment/start-session`, {
        method: "POST",
        body: formData,
      });
      if (!startRes.ok) throw new Error("Failed to start session");
      const startData = await startRes.json();
      console.log("Session started:", startData);
      
      setSessionIds(startData.session_id);
      setIsPdfMode(true);
      setShowChapters(false); 
      setChapter([]); 
     
      if (startData.ai_message) {
        setMessages([
          { role: "user", content: `Uploaded: ${file.name} successfully`, images: [] },
          { role: "assistant", content: startData.ai_message, images: [] }
        ]);
      } else {
        setMessages([
          { role: "assistant", content: "No response received from AI. Please try again.", images: [] }
        ]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setMessages([
        { role: "assistant", content: "Upload failed. Please check your file and try again.", images: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const messageText = (typeof text === 'string' && text.trim()) ? text.trim() : input.trim();
    if (!messageText || isLoading) return;

    if (isPdfMode && messageText.toLowerCase() === 'clear') {
      setMessages([{ role: 'assistant', content: starter, images: [] }]);
      setIsPdfMode(false);
      setSessionIds(null);
      setFile(null);
      setInput('');
      setShowChapters(true);
      initialMessage(subject);
      return;
    }
    
    if (isPdfMode) {
      setShowChapters(false);
      setMessages(prev =>
        prev.map(msg => msg.role === 'assistant' ? { ...msg, quick_replies: [] } : msg)
      );
      setMessages(prev => [...prev, { role: 'user', content: messageText, images: [] }]);
      setInput('');
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/assignment/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            session_id: sessionIds,
            student_message: messageText
          })
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Network error');
        }
        const data = await res.json();
        const newMessage = { role: 'assistant', content: data.ai_message, images: [] };
        setMessages(prev => [...prev, newMessage]);
        
        if (voiceEnabled && !isSpeaking) {
          speakText(newMessage.content, messages.length);
        }
      } catch (err) {
        console.error('Send error', err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Unable to reach the server. Please try again.',
          images: []
        }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
   
    setShowChapters(false);
    setMessages(prev =>
      prev.map(msg => msg.role === 'assistant' ? { ...msg, quick_replies: [] } : msg)
    );
    setMessages(prev => [...prev, { role: 'user', content: messageText, images: [] }]);
    setInput('');
    setIsLoading(true);
    
    let activeSessionId = sessionId || generateSessionId();

    try {
      const res = await fetch(API_URL + '/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          question: messageText,
          subject: subject,
          prompt: prompt,
          model: selectedModel,
          custom_prompt: useCustomPrompt ? customPrompt : defaultPrompt,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Network error');
      }

      const data = await res.json();
      const images = Array.isArray(data.images) ? data.images : [];

      const assistantMessage = {
        role: 'assistant',
        content: convertFractionsToMathML(data.response.replace(/<\/?strong>/g, '')
          .replace(
            /<hint>\s*(.*?)\s*<\/hint>/gs,
            `<div style="background-color:#f0f4f8; padding:12px; border-left:4px solid #3b82f6; border-radius:4px; margin:8px 0; font-style: italic;">$1</div>`
          ).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')),
        images: images,
        type: data.correct_answer,
        quick_replies: Array.isArray(data.quick_replies) ? data.quick_replies : [],
        inputTokens: data.input_tokens,
        outputTokens: data.output_tokens,
        totalCost: data.total_cost,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (voiceEnabled && !isSpeaking) {
        speakText(assistantMessage.content, messages.length);
      }

      if (data.type === 'cleared') {
        setMessages([{ role: 'assistant', content: starter, images: [] }]);
        setShowChapters(true);
        handleResetChat();
      }
    } catch (err) {
      console.error('Send error', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to reach the server. Please try again.', images: [] }]);
    } finally {
      setIsLoading(false);
    }
  };

  function PromptEditor() {
    const [localPrompt, setLocalPrompt] = useState(customPrompt || defaultPrompt);
    
    const handleSave = () => {
      setCustomPrompt(localPrompt);
      setUseCustomPrompt(true);
      setOpen(false);
    };

    return (
      <div
        className={`fixed top-0 right-0 w-full md:w-[600px] h-full bg-white z-50 transition-transform duration-300 shadow-2xl border-l border-gray-200
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Custom System Prompt</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 h-[calc(100%-140px)]">
          <textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            className="w-full h-full p-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono bg-white text-gray-800"
            placeholder="Enter your custom prompt here..."
          />
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save & Apply
          </button>
        </div>
      </div>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) sendMessage();
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Tutor Assistant</h1>
              <p className="text-sm text-gray-500">Professional Learning Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="fileInput"
                accept=".pdf,.docx,.jpg,.png"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <button
                onClick={() => document.getElementById("fileInput").click()}
                className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {file ? file.name.substring(0, 15) + '...' : 'Choose File'}
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isPdfMode}
              className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="maths">Mathematics</option>
              <option value="english">English</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2 rounded border border-gray-300 bg-white text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={prompt}
                onChange={(e) => setPrompt(!prompt)}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <span className="text-gray-700">Custom Prompt</span>
            </label>

            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={() => sendMessage('clear')}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      <PromptEditor />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`flex flex-col gap-2 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.type === true && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium">
                    <Check className="w-3 h-3" />
                    Correct Answer
                  </div>
                )}

                {msg.inputTokens && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>Input: {msg.inputTokens}</span>
                    <span>•</span>
                    <span>Output: {msg.outputTokens}</span>
                    <span>•</span>
                    <span>Cost: {msg.totalCost}</span>
                  </div>
                )}

                <div className={`relative rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.type === true
                    ? 'bg-green-50 border border-green-200 text-gray-800'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}>
                  <div
                    className="text-sm leading-relaxed pr-16"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />

                  {msg.role === 'assistant' && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => copyMessage(msg.content, idx)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Copy message"
                      >
                        {copiedMessageId === idx ? (
                          <CheckCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => speakText(msg.content, idx)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title={isSpeaking && speakingMessageId === idx ? "Stop speaking" : "Read aloud"}
                      >
                        {isSpeaking && speakingMessageId === idx ? (
                          <VolumeX className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.quick_replies && msg.quick_replies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.quick_replies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(reply)}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-xs text-gray-700"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {showChapters && Array.isArray(chapter) && chapter.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Select a topic to begin:</h3>
              {chapter.every(item => 'title' in item && !('chapters' in item)) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {chapter.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(item.title)}
                      className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-sm text-gray-700 text-left transition-colors"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              ) : (
                chapter.map((unit, unitIdx) => (
                  <div key={unitIdx} className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
                      {unit.unit}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {unit.chapters.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(unit.unit + " : " + item.title)}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-sm text-gray-700 text-left transition-colors"
                        >
                          <div className="font-medium">{item.title}</div>
                          {item.grammarTopics && item.grammarTopics.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.grammarTopics.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span>Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(models).map(([key, model]) => (
                    <option key={key} value={key}>{model.name}</option>
                  ))}
                </select>
              </label>

              <button
                onClick={() => setShowModelInfo(!showModelInfo)}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Model Info
              </button>

              {showModelInfo && (
                <div className="absolute bottom-20 left-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                  <button
                    onClick={() => setShowModelInfo(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h4 className="font-semibold text-gray-800 mb-2 pr-6">{models[selectedModel].name}</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Context:</span>
                      <span className="font-medium">{models[selectedModel].contextWindow}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Input:</span>
                      <span className="font-medium">{models[selectedModel].inputCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output:</span>
                      <span className="font-medium">{models[selectedModel].outputCost}</span>
                    </div>
                    <p className="pt-2 text-gray-600">{models[selectedModel].description}</p>
                  </div>
                </div>
              )}
            </div>

           <label
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5 text-green-500 transition-transform duration-200 hover:scale-110" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400 transition-transform duration-200 hover:scale-110" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Auto-speak responses
            </span>
          </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-3 rounded-lg border transition-colors ${
                isListening
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message or use voice input..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-800"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
