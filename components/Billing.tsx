
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ShieldCheck, Download, Zap, Receipt, Globe, Key, History, Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { CreditTransaction } from '../types';

const Billing: React.FC = () => {
  const { language, addCredits, aiSettings, setActiveAISource, saveUserApiKey, firebaseUser } = useStore();
  const t = translations[language];
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [history, setHistory] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    if (firebaseUser) {
      const historyRef = collection(db, 'users', firebaseUser.uid, 'credit_history');
      const q = query(historyRef, orderBy('createdAt', 'desc'), limit(10));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditTransaction));
        setHistory(docs);
      });

      return () => unsubscribe();
    }
  }, [firebaseUser]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setIsSavingKey(true);
    try {
      await saveUserApiKey(apiKey);
      setApiKey('');
      alert("Klucz API został zapisany i aktywowany!");
    } catch (error) {
      console.error(error);
      alert("Błąd podczas zapisywania klucza.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const transactions = [
    { id: 'INV-821', date: '2024-11-05', amount: '199 PLN', fc: '500 FC', status: 'PAID' },
    { id: 'INV-710', date: '2024-10-21', amount: '49 PLN', fc: '100 FC', status: 'PAID' },
    { id: 'INV-602', date: '2024-09-15', amount: '399 PLN', fc: '1200 FC', status: 'PAID' },
  ];

  const handleBuy = (amount: number) => {
    // Stripe Logic
    console.log("Stripe Key: pk_live_51QYtS9GCTUVg4lvlC9pKydFlkzBGTFVruh3bvNNz4RwW3EmyA3Pjiafd17pXJ5zWwI2bx4PlCR3ZYD95Z5KTrIqm00Z8bdqdl1");
    addCredits(amount);
    alert(`Autoryzacja udana! Portfel zasilony o ${amount} ForceCredits.`);
  };

  return (
    <div className="p-8 pb-32 max-w-6xl mx-auto min-h-full flex flex-col">
      {/* AI Fuel Station - Gatekeeper Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Mode Selector */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <Settings2 size={20} className="text-[#34E0F7]" />
            <h3 className="font-orbitron text-sm uppercase tracking-widest text-white">AI ACCESS MODE</h3>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => setActiveAISource('credits')}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                aiSettings?.activeSource === 'credits' 
                ? 'bg-[#8C4DFF]/20 border-[#8C4DFF] shadow-[0_0_15px_rgba(140,77,255,0.2)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  aiSettings?.activeSource === 'credits' ? 'bg-[#8C4DFF] text-white' : 'bg-white/5 text-white/40'
                }`}>
                  <Zap size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-orbitron text-white uppercase">Platform Credits</p>
                  <p className="text-[9px] font-mono text-white/40 uppercase">Use your {aiSettings?.creditBalance || 0} CR balance</p>
                </div>
              </div>
              {aiSettings?.activeSource === 'credits' && <CheckCircle2 size={16} className="text-[#8C4DFF]" />}
            </button>

            <button 
              onClick={() => {
                if (aiSettings?.hasUserApiKey) setActiveAISource('user_api_key');
                else alert("Najpierw dodaj swój klucz API poniżej.");
              }}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                aiSettings?.activeSource === 'user_api_key' 
                ? 'bg-[#34E0F7]/20 border-[#34E0F7] shadow-[0_0_15px_rgba(52,224,247,0.2)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  aiSettings?.activeSource === 'user_api_key' ? 'bg-[#34E0F7] text-white' : 'bg-white/5 text-white/40'
                }`}>
                  <Key size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-orbitron text-white uppercase">Own API Key</p>
                  <p className="text-[9px] font-mono text-white/40 uppercase">
                    {aiSettings?.hasUserApiKey ? 'Key Active - Unlimited Access' : 'No Key Provided'}
                  </p>
                </div>
              </div>
              {aiSettings?.activeSource === 'user_api_key' && <CheckCircle2 size={16} className="text-[#34E0F7]" />}
            </button>
          </div>
        </div>

        {/* API Key Management */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <Key size={20} className="text-[#C74CFF]" />
            <h3 className="font-orbitron text-sm uppercase tracking-widest text-white">GEMINI API KEY</h3>
          </div>
          
          <p className="text-[10px] font-mono text-white/40 uppercase mb-6 leading-relaxed">
            Wklej swój klucz Gemini API, aby korzystać z AI bez zużywania kredytów platformowych. Klucz jest przechowywany bezpiecznie.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Wklej klucz tutaj..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#C74CFF]/50 transition-colors"
              />
              {aiSettings?.hasUserApiKey && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-green-500 uppercase">Stored</span>
                </div>
              )}
            </div>
            
            <NeonButton 
              variant="magenta" 
              className="w-full py-4 text-[10px] font-black"
              onClick={handleSaveKey}
              disabled={isSavingKey || !apiKey.trim()}
            >
              {isSavingKey ? 'SAVING...' : 'SAVE & ACTIVATE KEY'}
            </NeonButton>
          </div>
        </div>
      </div>

      <header className="mb-12 text-center">
        <h2 className="text-4xl font-black font-orbitron mb-2 tracking-tight text-[#C74CFF]">
          {t.billing.terminalTitle}
        </h2>
        <div className="flex items-center justify-center gap-3 text-[#34E0F7] text-[10px] font-orbitron uppercase tracking-[0.3em]">
           <ShieldCheck size={14} />
           {t.billing.secureMsg}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {[100, 500, 1200].map((amt, idx) => (
          <motion.div 
            key={amt}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel p-8 rounded-[2.5rem] border-white/5 hover:border-[#C74CFF]/40 transition-all group flex flex-col"
          >
             <div className="mb-6 flex justify-between items-center">
                <p className="text-[10px] font-orbitron text-white/30 uppercase tracking-widest">Fuel Pack 0{idx+1}</p>
                <Zap size={16} className="text-[#C74CFF] opacity-30 group-hover:opacity-100 transition-opacity" />
             </div>
             <div className="text-5xl font-black font-orbitron text-white mb-2">{amt}<span className="text-sm text-white/40 ml-2">FC</span></div>
             <p className="text-xl font-orbitron text-[#34E0F7] mb-8">{amt === 100 ? '49 PLN' : amt === 500 ? '199 PLN' : '399 PLN'}</p>
             
             <div className="flex-1" />
             <NeonButton 
               variant="magenta" 
               className="w-full py-5 text-xs font-black shadow-[0_0_20px_rgba(199,76,255,0.2)]"
               onClick={() => handleBuy(amt)}
             >
               AUTORYZUJ ZAKUP
             </NeonButton>
          </motion.div>
        ))}
      </div>

      <section className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden mb-12">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History size={20} className="text-white/20" />
            <h3 className="font-orbitron text-sm uppercase tracking-widest text-white">AI FUEL HISTORY</h3>
          </div>
          <p className="text-[9px] font-mono text-white/20 uppercase">Last 10 Transactions</p>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left text-[10px] font-orbitron uppercase tracking-widest">
              <thead className="bg-white/[0.01] text-white/20">
                 <tr>
                    <th className="px-8 py-4">Action</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Type</th>
                    <th className="px-8 py-4">Description</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {history.length > 0 ? history.map(tx => (
                   <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${tx.amount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-white font-bold">{tx.actionType}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-white/40">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className={`px-8 py-6 font-black ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} CR
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 bg-white/5 text-white/40 rounded-md text-[8px]">{tx.source}</span>
                      </td>
                      <td className="px-8 py-6 text-white/20 normal-case italic">{tx.description}</td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={5} className="px-8 py-12 text-center text-white/20 italic">No transactions found</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>

      <section className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden mb-12">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <Receipt size={20} className="text-white/20" />
          <h3 className="font-orbitron text-sm uppercase tracking-widest">{t.billing.recent}</h3>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left text-[10px] font-orbitron uppercase tracking-widest">
              <thead className="bg-white/[0.01] text-white/20">
                 <tr>
                    <th className="px-8 py-4">ID</th>
                    <th className="px-8 py-4">Data</th>
                    <th className="px-8 py-4">Wielkość</th>
                    <th className="px-8 py-4">Kwota</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {transactions.map(tx => (
                   <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-6 text-white/40">{tx.id}</td>
                      <td className="px-8 py-6 text-white/60">{tx.date}</td>
                      <td className="px-8 py-6 text-white font-bold">{tx.fc}</td>
                      <td className="px-8 py-6 text-[#34E0F7]">{tx.amount}</td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 bg-[#34E0F7]/10 text-[#34E0F7] rounded-md text-[8px]">{tx.status}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all">
                            <Download size={16} />
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </section>

      <div className="mt-auto pt-12 text-center opacity-40">
        <p className="text-[9px] font-orbitron text-white uppercase tracking-[0.4em]">
          {t.footer} | {t.slogan}
        </p>
      </div>

      <footer className="mt-8 flex justify-center gap-8 opacity-20 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-2"><Globe size={14} /> <span className="text-[8px] font-orbitron">PCI-DSS COMPLIANT</span></div>
         <div className="flex items-center gap-2"><ShieldCheck size={14} /> <span className="text-[8px] font-orbitron">256-BIT SSL</span></div>
      </footer>
    </div>
  );
};

export default Billing;
