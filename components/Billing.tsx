import SubscriptionPanel from './SubscriptionPanel';
import { apiFetch } from '../apiClient';

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
  const { language, aiSettings, firebaseUser, workspaceId } = useStore();
  const t = translations[language];
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [history, setHistory] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    if (!firebaseUser || !workspaceId) return;

    const transactionsRef = collection(db, 'workspaces', workspaceId, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CreditTransaction[];
      setHistory(txs);
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    return () => unsubscribe();
  }, [firebaseUser, workspaceId]);

  const handleUpdateAISettings = async (updates: any) => {
    try {
      const response = await apiFetch('/api/ai/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...updates })
      });
      if (!response.ok) throw new Error("Failed to update AI settings");
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setIsSavingKey(true);
    try {
      await handleUpdateAISettings({ geminiApiKey: apiKey, activeSource: 'user_api_key' });
      setApiKey('');
      alert("Klucz API został zapisany i aktywowany!");
    } catch (error) {
      console.error(error);
      alert("Błąd podczas zapisywania klucza.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const transactions: {id: string; date: string; amount: string; fc: string; status: string}[] = [];

  const handleBuy = (_amount: number) => {
    alert('Zakup kredytów nie jest jeszcze dostępny. Możesz użyć własnego klucza Gemini w ustawieniach.');
  };

  return (
    <div className="p-8 pb-32 max-w-6xl mx-auto min-h-full flex flex-col">
      <SubscriptionPanel />
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
              onClick={() => handleUpdateAISettings({ activeSource: 'starter_credits' })}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                aiSettings?.activeSource !== 'user_api_key' 
                ? 'bg-[#8C4DFF]/20 border-[#8C4DFF] shadow-[0_0_15px_rgba(140,77,255,0.2)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  aiSettings?.activeSource !== 'user_api_key' ? 'bg-[#8C4DFF] text-white' : 'bg-white/5 text-white/40'
                }`}>
                  <Zap size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-orbitron text-white uppercase">Platform Credits</p>
                  <p className="text-[9px] font-mono text-white/40 uppercase">Use your {aiSettings?.creditBalance || 0} CR balance</p>
                </div>
              </div>
              {aiSettings?.activeSource !== 'user_api_key' && <CheckCircle2 size={16} className="text-[#8C4DFF]" />}
            </button>

            <button 
              onClick={() => {
                if (aiSettings?.hasUserApiKey) handleUpdateAISettings({ activeSource: 'user_api_key' });
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

      <div className="mt-auto pt-12 text-center opacity-40">
        <p className="text-[9px] font-orbitron text-white uppercase tracking-[0.4em]">
          {t.footer} | {t.slogan}
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-slate-400">Płatności i faktury obsługuje Stripe. Zarządzaj abonamentem w panelu powyżej.</p>
    </div>
  );
};

export default Billing;
