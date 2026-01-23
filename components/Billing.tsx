
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ShieldCheck, Download, Zap, Receipt, Globe } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import NeonButton from './NeonButton';

const Billing: React.FC = () => {
  const { language, addCredits } = useStore();
  const t = translations[language];

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
