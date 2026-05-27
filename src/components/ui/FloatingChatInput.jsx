'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Leaf, X, Mic, MicOff, Paperclip } from 'lucide-react';

export default function FloatingChatInput({ onSubmit, isLoading }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null); // base64 string
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'id-ID'; // Indonesian Language for Indonesian financial slang input

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setText(prev => (prev ? prev + ' ' + transcript : transcript));
        };

        rec.onerror = (e) => {
          console.warn('Speech recognition error:', e.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Hanya bisa mengunggah file gambar struk belanja ya! 📸");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser kamu belum mendukung input suara. Gunakan Google Chrome atau Safari ya! 🎙️");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    
    // Stop recording if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    await onSubmit(text, image);
    setText('');
    setImage(null);
    setIsExpanded(false); // Collapse after successfully submitting/sending
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex items-center justify-end">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence initial={false} mode="wait">
        {!isExpanded ? (
          // Collapsed circular button state
          <motion.button
            key="collapsed-fab"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 bg-forest text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(45,106,79,0.35)] hover:bg-forest/90 relative cursor-pointer group border-2 border-mint"
          >
            {/* Pulse effect */}
            <span className="absolute inset-0 rounded-full bg-forest animate-ping opacity-15 group-hover:opacity-5 pointer-events-none" />
            
            <Leaf className="w-6 h-6 text-mint animate-pulse" />
            
            {/* Desktop Tooltip */}
            <span className="absolute right-16 bg-forest text-white px-3 py-1.5 rounded-xl text-xs font-bold font-quicksand whitespace-nowrap shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none border border-mint/30">
              Tanya AI Terrarium 🌿
            </span>
          </motion.button>
        ) : (
          // Expanded chat input pill state
          <motion.form
            key="expanded-input"
            onSubmit={handleSend}
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center bg-white p-2 rounded-full shadow-[0_10px_40px_rgba(45,106,79,0.22)] border-2 border-mint overflow-hidden w-[calc(100vw-32px)] md:w-[420px]"
          >
            {/* Close Button to collapse back to FAB */}
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setText('');
                setImage(null);
                if (isListening && recognitionRef.current) {
                  recognitionRef.current.stop();
                }
              }}
              className="w-8 h-8 rounded-full bg-mint/45 hover:bg-mint/80 text-forest flex items-center justify-center transition-colors shrink-0 mr-1.5"
              title="Tutup Chat"
            >
              <X size={15} />
            </button>

            {/* Thumbnail Preview */}
            {image && (
              <div className="relative shrink-0 ml-1 mr-2 group">
                <img src={image} className="w-8 h-8 rounded-lg object-cover border border-mint" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-terracotta text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow-sm hover:bg-terracotta/90"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isListening ? "Mendengarkan suara..." : (image ? "Tambahkan ket. wallet..." : "Tulis transaksi atau klik mic/struk...")}
              className="flex-1 bg-transparent px-2 py-2 outline-none font-quicksand text-forest placeholder:text-forest/40 text-sm font-bold min-w-0"
              disabled={isLoading}
            />

            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 hover:bg-mint/45 text-forest/70 mr-0.5"
              title="Unggah Struk Belanja/Foto"
            >
              <Paperclip size={16} />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors mr-1 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-sm' 
                  : 'hover:bg-mint/45 text-forest/70'
              }`}
              title={isListening ? "Hentikan Rekam Suara" : "Masukan dengan Suara (Voice)"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Send Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={isLoading || (!text.trim() && !image)}
              className="bg-forest text-white rounded-full flex items-center justify-center shrink-0 h-10 w-10 disabled:opacity-50 hover:bg-forest/90 transition-colors"
            >
              {isLoading ? (
                <Leaf className="animate-spin text-mint" size={16} />
              ) : (
                <Send size={16} className="text-mint" />
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

