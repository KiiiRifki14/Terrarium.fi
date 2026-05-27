'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, HelpCircle, Sparkles, Heart } from 'lucide-react';

export default function InteractiveTerrarium({ savingsRate = 0 }) {
  // Persistence
  const [treeHeight, setTreeHeight] = useState(15); // in cm
  const [waterCount, setWaterCount] = useState(0);
  const [catLove, setCatLove] = useState(0);
  const [catMessage, setCatMessage] = useState('Meow! Selamat datang di kebun mini Terrarium! 🐾');
  const [showBubble, setShowBubble] = useState(true);
  
  // Animation Triggers
  const [catState, setCatState] = useState('idle'); // 'idle' | 'happy' | 'play' | 'meow' | 'eating'
  const [treeShake, setTreeShake] = useState(false);
  const [waterDroplets, setWaterDroplets] = useState([]);
  const [fishItems, setFishItems] = useState([]);
  const [yarnBalls, setYarnBalls] = useState([]);
  const [loveHearts, setLoveHearts] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const savedHeight = localStorage.getItem('terrarium_tree_height');
    const savedWater = localStorage.getItem('terrarium_water_count');
    const savedLove = localStorage.getItem('terrarium_cat_love');
    if (savedHeight) setTreeHeight(parseFloat(savedHeight));
    if (savedWater) setWaterCount(parseInt(savedWater));
    if (savedLove) setCatLove(parseInt(savedLove));
  }, []);

  // Save utility
  const saveStats = (newHeight, newWater, newLove) => {
    localStorage.setItem('terrarium_tree_height', newHeight.toFixed(1));
    localStorage.setItem('terrarium_water_count', newWater.toString());
    localStorage.setItem('terrarium_cat_love', newLove.toString());
  };

  // Determine Growth level based on Savings Rate and Water count
  // Level 1: Sprout, Level 2: Sapling, Level 3: Lush Plant, Level 4: Golden Money Tree
  const baseLevel = savingsRate <= 0 ? 1 : savingsRate <= 25 ? 2 : savingsRate <= 50 ? 3 : 4;
  const growthBonus = Math.floor(waterCount / 10);
  const growthLevel = Math.min(baseLevel + growthBonus, 4);

  // Cat messages pool
  const catQuotes = [
    "Meow! Tabunganmu subur hari ini! Tetap pertahankan ya! 🐾",
    "Purrr... Jangan lupa siram budget makan luar biar gak layu! 😸",
    "Zzz... Tumi lagi tidur nunggu gajian tiba... 💤",
    "Jangan boros-boros ya, nanti tanaman kita bisa layu! 🍂",
    "Meow! Aku suka berteduh di bawah pohon keuanganmu! 🌳",
    "Tumi paling suka kalau saldo kamu hijau! Purrr~ 💚",
    "Nyam nyam... Kapan kita beli ikan salmon premium? 🐟",
    "Siram tanaman airnya cukup ya, jangan kebanyakan jajan juga! 🚿",
    "Meow! Yuk catat transaksimu biar kebun kita makin rimbun! 🌿"
  ];

  const triggerBubble = (msg) => {
    setCatMessage(msg);
    setShowBubble(true);
    // Auto hide bubble after 5s
    const timer = setTimeout(() => setShowBubble(false), 5000);
    return () => clearTimeout(timer);
  };

  // 1. Water Garden
  const handleWater = () => {
    if (waterDroplets.length > 5) return; // limit active animations
    
    // Create droplets
    const newDroplets = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: 35 + Math.random() * 40, // random X position inside the jar
      delay: i * 0.15
    }));
    
    setWaterDroplets(prev => [...prev, ...newDroplets]);
    setWaterCount(w => {
      const nextW = w + 1;
      setTreeHeight(h => {
        const nextH = h + 0.2;
        saveStats(nextH, nextW, catLove);
        return nextH;
      });
      return nextW;
    });

    // Shake tree when watered
    setTimeout(() => {
      setTreeShake(true);
      setTimeout(() => setTreeShake(false), 600);
    }, 400);

    // Make cat happy
    setCatState('happy');
    triggerBubble("Aaaah segar sekali! Makasih ya sudah siram tanaman! 💧🐱");
    setTimeout(() => setCatState('idle'), 2500);
  };

  // 2. Feed Cat
  const handleFeed = () => {
    if (fishItems.length > 0) return;
    
    const newFish = {
      id: Date.now(),
      x: 110 + Math.random() * 20
    };
    setFishItems([newFish]);
    setCatState('play');

    // Cat goes to eat
    setTimeout(() => {
      setCatState('eating');
      setFishItems([]);
      
      // Spawn hearts
      const newHearts = Array.from({ length: 3 }).map((_, i) => ({
        id: Date.now() + i,
        x: 120 + (i - 1) * 12,
        y: 110
      }));
      setLoveHearts(newHearts);
      
      setCatLove(l => {
        const nextL = l + 1;
        saveStats(treeHeight, waterCount, nextL);
        return nextL;
      });

      triggerBubble("Nyam nyam... Enak banget! Tumi sayang kamu! ❤️🐟");
      
      setTimeout(() => {
        setCatState('happy');
        setTimeout(() => setCatState('idle'), 2000);
      }, 1500);
    }, 800);
  };

  // 3. Play with Yarn
  const handlePlay = () => {
    if (yarnBalls.length > 0) return;

    const newYarn = {
      id: Date.now(),
      x: -30 // start offscreen left
    };
    setYarnBalls([newYarn]);
    setCatState('play');

    setTimeout(() => {
      triggerBubble("Horeee! Bola benangnya lucu! Meoww! 🧶🐾");
      // Clean up yarn after rolling across
      setTimeout(() => {
        setYarnBalls([]);
        setCatState('idle');
      }, 1200);
    }, 400);
  };

  // 4. Click Cat directly
  const handleCatClick = () => {
    const randomQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)];
    setCatState('meow');
    triggerBubble(randomQuote);
    
    // Spawn a heart
    const newHeart = {
      id: Date.now(),
      x: 120 + Math.random() * 10,
      y: 95
    };
    setLoveHearts(prev => [...prev, newHeart]);

    setTimeout(() => setCatState('idle'), 2000);
  };

  return (
    <div className="bg-white border border-mint rounded-[32px] p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-fredoka text-forest font-bold flex items-center gap-1.5">
            <span>Kebun Mini Tumi 🪴</span>
          </h3>
          <p className="text-[10px] text-forest/50 font-quicksand font-bold">
            Tinggi Pohon: <span className="text-forest font-bold">{treeHeight.toFixed(1)} cm</span>
            {' • '}Sayang Tumi: <span className="text-rose-500 font-bold">❤️ {catLove}</span>
          </p>
        </div>
        <div className="flex gap-1">
          <span className="text-xs bg-mint/50 px-2 py-0.5 rounded-full text-forest font-bold font-quicksand">
            Level {growthLevel}
          </span>
        </div>
      </div>

      {/* Terrarium Glass Container */}
      <div className="relative w-full h-[190px] border-4 border-mint/40 rounded-t-[120px] rounded-b-[40px] bg-gradient-to-b from-white/40 to-mint/15 shadow-inner overflow-hidden flex items-end justify-center pb-3">
        {/* Cork Cap */}
        <div className="absolute top-0 w-20 h-4 bg-amber-800/70 rounded-full border-b border-amber-900/40 shadow-sm" />
        
        {/* Soil Base */}
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-amber-950/40 to-amber-900/20 rounded-b-[36px] border-t border-amber-900/10 pointer-events-none" />

        {/* Financial Sprout/Tree */}
        <motion.div
          animate={treeShake ? {
            rotate: [0, -3, 3, -2, 2, 0],
            scale: [1, 1.02, 0.98, 1.01, 1]
          } : {}}
          transition={{ duration: 0.6 }}
          className="absolute bottom-3 left-[28%] -translate-x-1/2 origin-bottom cursor-pointer pointer-events-auto"
          onClick={() => {
            setTreeShake(true);
            setTimeout(() => setTreeShake(false), 600);
            triggerBubble("Sshhh... Daunku bergoyang tertiup angin tabungan! 🍃");
          }}
        >
          <svg width="100" height="130" viewBox="0 0 100 130" fill="none" className="overflow-visible">
            {/* Trunk */}
            <path
              d="M50,130 C50,110 47,80 50,60"
              stroke="#8C6239"
              strokeWidth={growthLevel === 1 ? 4 : growthLevel === 2 ? 6 : growthLevel === 3 ? 8 : 10}
              strokeLinecap="round"
            />
            {growthLevel >= 2 && (
              <>
                <path d="M50,90 C45,80 35,75 32,70" stroke="#8C6239" strokeWidth={growthLevel >= 3 ? 5 : 3} strokeLinecap="round" />
                <path d="M50,80 C55,72 65,68 68,62" stroke="#8C6239" strokeWidth={growthLevel >= 3 ? 5 : 3} strokeLinecap="round" />
              </>
            )}
            {growthLevel >= 3 && (
              <>
                <path d="M50,70 C42,60 38,50 35,45" stroke="#8C6239" strokeWidth="4" strokeLinecap="round" />
                <path d="M50,60 C58,52 62,45 65,40" stroke="#8C6239" strokeWidth="4" strokeLinecap="round" />
              </>
            )}

            {/* Leaves */}
            {growthLevel === 1 && (
              <>
                <circle cx="50" cy="55" r="9" fill="#52B788" opacity="0.9" />
                <circle cx="43" cy="50" r="7" fill="#74C69D" opacity="0.9" />
                <circle cx="56" cy="52" r="7" fill="#40916C" opacity="0.9" />
              </>
            )}
            {growthLevel === 2 && (
              <>
                {/* Branch Left */}
                <circle cx="28" cy="66" r="8" fill="#52B788" />
                {/* Branch Right */}
                <circle cx="70" cy="58" r="8" fill="#40916C" />
                {/* Center Top */}
                <circle cx="50" cy="52" r="11" fill="#74C69D" />
                <circle cx="44" cy="44" r="8" fill="#52B788" />
              </>
            )}
            {growthLevel === 3 && (
              <>
                {/* Left Branch Leaves */}
                <circle cx="28" cy="66" r="10" fill="#40916C" />
                <circle cx="32" cy="56" r="8" fill="#52B788" />
                {/* Right Branch Leaves */}
                <circle cx="70" cy="58" r="10" fill="#52B788" />
                <circle cx="64" cy="48" r="8" fill="#74C69D" />
                {/* Top Leaves */}
                <circle cx="50" cy="45" r="14" fill="#74C69D" />
                <circle cx="42" cy="35" r="10" fill="#52B788" />
                <circle cx="58" cy="35" r="10" fill="#40916C" />
              </>
            )}
            {growthLevel === 4 && (
              <>
                {/* Golden/Emerald Money Tree */}
                <circle cx="28" cy="66" r="12" fill="#2D6A4F" />
                <circle cx="30" cy="52" r="10" fill="#52B788" />
                <circle cx="70" cy="58" r="12" fill="#52B788" />
                <circle cx="66" cy="44" r="10" fill="#74C69D" />
                
                {/* Top Giant Crown */}
                <circle cx="50" cy="42" r="16" fill="#74C69D" />
                <circle cx="40" cy="30" r="12" fill="#52B788" />
                <circle cx="60" cy="30" r="12" fill="#40916C" />
                <circle cx="50" cy="22" r="10" fill="#D8F3DC" />
                
                {/* Shiny Gold Coins */}
                <circle cx="35" cy="58" r="3.5" fill="#F4A261" />
                <circle cx="62" cy="50" r="3.5" fill="#F4A261" />
                <circle cx="48" cy="34" r="4" fill="#E9C46A" />
                <circle cx="54" cy="26" r="3.5" fill="#E9C46A" />
                <circle cx="26" cy="64" r="3.5" fill="#E9C46A" />
              </>
            )}
          </svg>
        </motion.div>

        {/* Tumi the Cat */}
        <motion.div
          onClick={handleCatClick}
          className="absolute bottom-3 left-[68%] -translate-x-1/2 cursor-pointer origin-bottom"
          animate={
            catState === 'play' ? { y: [0, -18, 0], scaleY: [1, 0.85, 1.1, 1] } :
            catState === 'meow' ? { scaleX: [1, 1.05, 0.95, 1] } :
            catState === 'happy' ? { y: [0, -4, 0], rotate: [0, -3, 3, 0] } :
            catState === 'eating' ? { x: [0, -3, 3, -3, 0], y: [0, -2, 0] } :
            {}
          }
          transition={{ duration: catState === 'play' ? 0.6 : 0.4, repeat: catState === 'eating' ? 2 : 0 }}
        >
          <svg width="68" height="68" viewBox="0 0 100 100" className="overflow-visible">
            {/* Tail */}
            <motion.path
              d="M75,70 C85,65 90,50 86,40"
              stroke="#E07A5F"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{ originX: '75px', originY: '70px' }}
            />
            {/* Feet */}
            <ellipse cx="40" cy="80" rx="6" ry="4" fill="#C26046" />
            <ellipse cx="60" cy="80" rx="6" ry="4" fill="#C26046" />
            
            {/* Body */}
            <ellipse cx="50" cy="65" rx="18" ry="20" fill="#E07A5F" />
            {/* Chest overlay */}
            <ellipse cx="50" cy="70" rx="10" ry="12" fill="#FCF3F0" opacity="0.9" />

            {/* Head */}
            <motion.g
              animate={catState === 'meow' ? { y: [0, -2, 0] } : {}}
            >
              {/* Ears */}
              <polygon points="36,46 32,28 46,38" fill="#E07A5F" />
              <polygon points="38,44 34,31 44,38" fill="#FCF3F0" />
              
              <polygon points="64,46 68,28 54,38" fill="#E07A5F" />
              <polygon points="62,44 66,31 56,38" fill="#FCF3F0" />
              
              {/* Main Face */}
              <circle cx="50" cy="46" r="16" fill="#E07A5F" />

              {/* Eyes */}
              {catState === 'happy' || catState === 'eating' ? (
                <>
                  <path d="M40,44 Q44,48 46,44" stroke="#2D6A4F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M54,44 Q56,48 60,44" stroke="#2D6A4F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  {/* Normal open/curved eyes */}
                  <circle cx="43" cy="43" r="2.5" fill="#2D6A4F" />
                  <circle cx="57" cy="43" r="2.5" fill="#2D6A4F" />
                  <circle cx="44" cy="42" r="0.8" fill="white" />
                  <circle cx="58" cy="42" r="0.8" fill="white" />
                </>
              )}

              {/* Nose */}
              <polygon points="49,48 51,48 50,50" fill="#FCF3F0" />

              {/* Mouth */}
              {catState === 'meow' ? (
                <ellipse cx="50" cy="53" rx="3" ry="4" fill="#C26046" />
              ) : (
                <path d="M48,51 Q50,53 52,51" stroke="#2D6A4F" strokeWidth="1.5" fill="none" />
              )}

              {/* Whiskers */}
              <line x1="30" y1="48" x2="38" y2="48" stroke="#2D6A4F" strokeWidth="1" />
              <line x1="28" y1="52" x2="38" y2="50" stroke="#2D6A4F" strokeWidth="1" />
              <line x1="70" y1="48" x2="62" y2="48" stroke="#2D6A4F" strokeWidth="1" />
              <line x1="72" y1="52" x2="62" y2="50" stroke="#2D6A4F" strokeWidth="1" />
            </motion.g>
          </svg>
        </motion.div>

        {/* Speech Bubble overlay */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute top-6 left-6 right-6 bg-white border border-mint/70 rounded-2xl p-2.5 shadow-md z-10 text-[10px] font-bold font-quicksand text-forest leading-relaxed"
            >
              <div className="absolute -bottom-1.5 right-[28%] w-3 h-3 bg-white border-r border-b border-mint/70 rotate-45" />
              <div className="flex gap-1.5 items-start">
                <span className="text-xs shrink-0">🐱</span>
                <p>{catMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Water Droplet particles */}
        {waterDroplets.map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: -20, x: `${drop.x}%`, opacity: 0 }}
            animate={{
              y: 155,
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 0.7,
              delay: drop.delay,
              ease: 'easeIn'
            }}
            onAnimationComplete={() => {
              setWaterDroplets(prev => prev.filter(d => d.id !== drop.id));
            }}
            className="absolute top-0 w-2.5 h-3.5 bg-[#8ECAE6] rounded-full"
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
            }}
          />
        ))}

        {/* Falling Fish for Feeding */}
        {fishItems.map((fish) => (
          <motion.div
            key={fish.id}
            initial={{ y: -20, x: fish.x, opacity: 0, rotate: 45 }}
            animate={{
              y: 150,
              opacity: [0, 1, 1]
            }}
            transition={{
              duration: 0.8,
              ease: 'easeIn'
            }}
            className="absolute text-sm z-10 pointer-events-none select-none"
          >
            🐟
          </motion.div>
        ))}

        {/* Rolling Yarn Ball */}
        {yarnBalls.map((yarn) => (
          <motion.div
            key={yarn.id}
            initial={{ x: -30, y: 150 }}
            animate={{
              x: 180,
              rotate: 360
            }}
            transition={{
              duration: 1.2,
              ease: 'linear'
            }}
            className="absolute text-lg z-10 pointer-events-none select-none"
          >
            🧶
          </motion.div>
        ))}

        {/* Happy hearts */}
        {loveHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ x: heart.x, y: heart.y, opacity: 1, scale: 0.5 }}
            animate={{
              y: heart.y - 45,
              x: heart.x + (Math.random() * 20 - 10),
              opacity: 0,
              scale: 1.2
            }}
            transition={{
              duration: 1.2,
              ease: 'easeOut'
            }}
            onAnimationComplete={() => {
              setLoveHearts(prev => prev.filter(h => h.id !== heart.id));
            }}
            className="absolute text-xs text-rose-500 z-20 pointer-events-none"
          >
            ❤️
          </motion.div>
        ))}
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleWater}
          className="py-2.5 rounded-2xl bg-mint/40 text-forest border border-mint hover:bg-mint/70 transition-all font-bold text-[10px] font-quicksand flex items-center justify-center gap-1 shadow-sm active:scale-95"
        >
          <Droplet size={11} className="text-spring" />
          <span>Siram 💧</span>
        </button>
        <button
          onClick={handleFeed}
          className="py-2.5 rounded-2xl bg-[#FCF3F0] text-terracotta border border-terracotta/20 hover:bg-[#F5DACB] transition-all font-bold text-[10px] font-quicksand flex items-center justify-center gap-1 shadow-sm active:scale-95"
        >
          <span>🐟</span>
          <span>Beri Makan</span>
        </button>
        <button
          onClick={handlePlay}
          className="py-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all font-bold text-[10px] font-quicksand flex items-center justify-center gap-1 shadow-sm active:scale-95"
        >
          <span>🧶</span>
          <span>Ajak Main</span>
        </button>
      </div>
    </div>
  );
}
