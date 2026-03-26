import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Settings2, 
  Globe, 
  Send,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../store';
import { UserIntegration, OutboundEventType, IntegrationType } from '../types';
import NeonButton from './NeonButton';

const EVENT_OPTIONS: { value: OutboundEventType; label: string; desc: string }[] = [
  { value: 'post_created', label: 'Post Created', desc: 'Triggered when a new social post is generated' },
  { value: 'post_updated', label: 'Post Updated', desc: 'Triggered when post content or status changes' },
  { value: 'post_scheduled', label: 'Post Scheduled', desc: 'Triggered when a post is added to the planner' },
  { value: 'post_sent', label: 'Post Sent', desc: 'Triggered when a post is transmitted to external systems' },
  { value: 'ai_asset_generated', label: 'AI Asset Generated', desc: 'Triggered when an image or video is created in Studio' },
  { value: 'asset_added', label: 'Asset Added', desc: 'Triggered when a new file is uploaded to Media Lab' },
  { value: 'brand_updated', label: 'Brand Updated', desc: 'Triggered when brand DNA or settings change' },
  { value: 'draft_completed', label: 'Draft Completed', desc: 'Triggered when a post draft is finalized' },
  { value: 'export_to_external', label: 'Export to External', desc: 'Triggered when manual export is initiated' },
];

const Integrations: React.FC = () => {
  const { integrations, addIntegration, removeIntegration, updateIntegration, toggleIntegration, triggerOutboundEvent, userId, workspaceId } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null);

  const [newIntegration, setNewIntegration] = useState<{
    name: string;
    type: IntegrationType;
    endpointUrl: string;
    events: OutboundEventType[];
  }>({
    name: '',
    type: 'zapier',
    endpointUrl: '',
    events: ['post_created', 'post_sent'],
  });

  const handleAdd = () => {
    if (!newIntegration.name || !newIntegration.endpointUrl) return;

    const integration: UserIntegration = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      workspaceId,
      name: newIntegration.name,
      type: newIntegration.type,
      endpointUrl: newIntegration.endpointUrl,
      isEnabled: true,
      events: newIntegration.events,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addIntegration(integration);
    setShowAddModal(false);
    setNewIntegration({
      name: '',
      type: 'zapier',
      endpointUrl: '',
      events: ['post_created', 'post_sent'],
    });
  };

  const handleTest = async (integration: UserIntegration) => {
    setIsTesting(integration.id);
    setTestResult(null);

    try {
      // Send a test payload
      const payload = {
        eventType: 'test_event',
        userId,
        workspaceId,
        brandName: 'Test Brand',
        content: 'This is a test payload from Social Media Studio.',
        createdAt: new Date().toISOString(),
        sourceModule: 'dashboard' as const,
        metadata: { isTest: true }
      };

      const response = await fetch(integration.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setTestResult({ id: integration.id, success: response.ok });
    } catch (error) {
      setTestResult({ id: integration.id, success: false });
    } finally {
      setIsTesting(null);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const toggleEvent = (event: OutboundEventType) => {
    setNewIntegration(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar bg-transparent p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#34E0F7]/10 rounded-xl border border-[#34E0F7]/20">
                <Zap className="text-[#34E0F7]" size={24} />
              </div>
              <h1 className="text-4xl font-black font-orbitron tracking-tight text-white">
                INTEGRATIONS <span className="text-[#34E0F7]">&</span> AUTOMATION
              </h1>
            </div>
            <p className="text-white/40 font-medium max-w-xl">
              Connect Social Media Studio to your external workflow. Send data to Zapier, Make, WordPress, or custom endpoints via webhooks.
            </p>
          </div>
          
          <NeonButton variant="cyan" onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> ADD INTEGRATION
          </NeonButton>
        </header>

        {/* INTEGRATIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {integrations.map((integration) => (
              <motion.div
                key={integration.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-panel p-6 rounded-3xl border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl border ${
                      integration.type === 'zapier' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20'
                    }`}>
                      {integration.type === 'zapier' ? (
                        <Activity className="text-orange-500" size={24} />
                      ) : (
                        <Globe className="text-blue-500" size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white font-orbitron">{integration.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                        <span>{integration.type}</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="truncate max-w-[150px]">{integration.endpointUrl}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleIntegration(integration.id)}
                    className={`p-2 rounded-xl transition-all ${
                      integration.isEnabled ? 'text-[#34E0F7] bg-[#34E0F7]/10' : 'text-white/20 bg-white/5'
                    }`}
                  >
                    {integration.isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {integration.events.map(event => (
                      <span key={event} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] text-white/60 uppercase tracking-wider font-bold">
                        {event.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleTest(integration)}
                        disabled={isTesting === integration.id}
                        className="flex items-center gap-2 text-[11px] font-bold text-[#34E0F7] hover:text-white transition-colors uppercase tracking-widest"
                      >
                        {isTesting === integration.id ? (
                          <div className="w-4 h-4 border-2 border-[#34E0F7] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        {testResult?.id === integration.id ? (
                          testResult.success ? <span className="text-green-400">SUCCESS</span> : <span className="text-red-400">FAILED</span>
                        ) : 'TEST CONNECTION'}
                      </button>
                    </div>

                    <button 
                      onClick={() => removeIntegration(integration.id)}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {integrations.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center glass-panel rounded-[3rem] border-dashed border-white/10 bg-white/5">
              <div className="p-6 bg-white/5 rounded-full mb-6">
                <LinkIcon size={48} className="text-white/20" />
              </div>
              <h3 className="text-2xl font-bold text-white font-orbitron mb-2">NO ACTIVE INTEGRATIONS</h3>
              <p className="text-white/40 text-center max-w-md mb-8">
                Connect your workspace to external tools to automate your content distribution and workflow.
              </p>
              <NeonButton variant="cyan" onClick={() => setShowAddModal(true)}>
                <Plus size={20} /> CONFIGURE FIRST WEBHOOK
              </NeonButton>
            </div>
          )}
        </div>

        {/* INFO SECTION */}
        <section className="glass-panel p-8 rounded-[2rem] border-white/10 bg-black/20">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-[#8C4DFF]/10 rounded-2xl border border-[#8C4DFF]/20">
              <Settings2 className="text-[#8C4DFF]" size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white font-orbitron">HOW IT WORKS</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="text-[#8C4DFF] font-black font-orbitron text-xl">01</div>
                  <h4 className="text-white font-bold">Create Webhook</h4>
                  <p className="text-white/40 text-sm">Create a "Catch Hook" in Zapier or Make and copy the unique URL provided.</p>
                </div>
                <div className="space-y-2">
                  <div className="text-[#8C4DFF] font-black font-orbitron text-xl">02</div>
                  <h4 className="text-white font-bold">Select Events</h4>
                  <p className="text-white/40 text-sm">Choose which actions in Social Media Studio should trigger the data transmission.</p>
                </div>
                <div className="space-y-2">
                  <div className="text-[#8C4DFF] font-black font-orbitron text-xl">03</div>
                  <h4 className="text-white font-bold">Automate</h4>
                  <p className="text-white/40 text-sm">Use the received payload to update WordPress, CRM, or any other external system.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-panel p-10 rounded-[3rem] border-white/20 bg-[#0A0A12] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#34E0F7] to-[#8C4DFF]" />
              
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black font-orbitron text-white">NEW INTEGRATION</h2>
                  <p className="text-white/40 text-sm">Configure your outbound data stream.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-white/20 hover:text-white transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-8">
                {/* NAME & TYPE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-[0.3em] font-black">Integration Name</label>
                    <input 
                      type="text"
                      value={newIntegration.name}
                      onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Zapier Social Workflow"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#34E0F7] transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-[0.3em] font-black">Type</label>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                      {(['zapier', 'webhook'] as IntegrationType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => setNewIntegration(prev => ({ ...prev, type }))}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-orbitron font-black uppercase tracking-widest transition-all ${
                            newIntegration.type === type ? 'bg-[#34E0F7] text-black' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ENDPOINT */}
                <div className="space-y-3">
                  <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-[0.3em] font-black">Endpoint URL</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="url"
                      value={newIntegration.endpointUrl}
                      onChange={(e) => setNewIntegration(prev => ({ ...prev, endpointUrl: e.target.value }))}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white outline-none focus:border-[#34E0F7] transition-all"
                    />
                  </div>
                </div>

                {/* EVENTS */}
                <div className="space-y-4">
                  <label className="text-[10px] font-orbitron text-white/40 uppercase tracking-[0.3em] font-black">Trigger Events</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {EVENT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => toggleEvent(option.value)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all text-left ${
                          newIntegration.events.includes(option.value)
                            ? 'bg-[#34E0F7]/10 border-[#34E0F7]/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`mt-1 p-1 rounded-md ${
                          newIntegration.events.includes(option.value) ? 'bg-[#34E0F7] text-black' : 'bg-white/10 text-white/20'
                        }`}>
                          <ChevronRight size={12} />
                        </div>
                        <div>
                          <div className={`text-[11px] font-bold uppercase tracking-wider ${
                            newIntegration.events.includes(option.value) ? 'text-[#34E0F7]' : 'text-white/60'
                          }`}>
                            {option.label}
                          </div>
                          <div className="text-[9px] text-white/30 leading-tight mt-1">{option.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-white/40 font-orbitron font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    CANCEL
                  </button>
                  <NeonButton 
                    variant="cyan" 
                    onClick={handleAdd}
                    className="flex-1"
                    disabled={!newIntegration.name || !newIntegration.endpointUrl}
                  >
                    ACTIVATE INTEGRATION
                  </NeonButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Integrations;
