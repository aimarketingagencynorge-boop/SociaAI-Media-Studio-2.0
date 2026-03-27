import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Trash2, 
  Sparkles, 
  Wand2, 
  CheckCircle2, 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Type,
  Maximize2,
  RefreshCw,
  Send,
  Download,
  History,
  Dna,
  Star
} from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { gemini } from '../geminiService';
import { MediaAsset, SocialPost, BrandReferenceImage } from '../types';
import NeonButton from './NeonButton';
import SmartVision from './SmartVision';

const MediaLab: React.FC = () => {
  const { 
    language, 
    brand, 
    mediaAssets, 
    addMediaAsset, 
    removeMediaAsset, 
    updateMediaAsset,
    addPost,
    setActiveView,
    triggerOutboundEvent
  } = useStore();
  
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'composer'>('workspace');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const showSuccess = (msg: string, duration = 3000, callback?: () => void) => {
    setSuccessMsg(msg);
    const timeout = setTimeout(() => {
      setSuccessMsg(null);
      if (callback) callback();
    }, duration);
    timeoutsRef.current.push(timeout);
  };

  // Post Composer State
  const [postDraft, setPostDraft] = useState({
    content: '',
    hook: '',
    platform: 'instagram' as any,
    dayIndex: 0,
    mediaDescription: ''
  });

  const [showDNAImport, setShowDNAImport] = useState(false);

  const selectedAsset = mediaAssets.find(a => a.id === selectedAssetId);

  const handleImportFromDNA = (image: BrandReferenceImage) => {
    const newAsset: MediaAsset = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      sourceUrl: image.imageUrl,
      createdAt: new Date().toISOString(),
      status: 'original'
    };
    
    addMediaAsset(newAsset);
    setSelectedAssetId(newAsset.id);
    setShowDNAImport(false);

    triggerOutboundEvent({
      eventType: 'asset_added',
      assetUrl: newAsset.sourceUrl,
      sourceModule: 'media-lab',
      metadata: {
        type: 'image',
        source: 'brand-dna'
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const type = file.type.startsWith('video') ? 'video' : 'image';
        
        const newAsset: MediaAsset = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          sourceUrl: base64,
          createdAt: new Date().toISOString(),
          status: 'original'
        };
        
        addMediaAsset(newAsset);
        if (i === 0) setSelectedAssetId(newAsset.id);

        triggerOutboundEvent({
          eventType: 'asset_added',
          assetUrl: newAsset.sourceUrl,
          sourceModule: 'media-lab',
          metadata: {
            type: newAsset.type,
            fileName: file.name
          }
        });
      };
      
      reader.readAsDataURL(file);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEnhanceImage = async (prompt: string) => {
    if (!selectedAsset || selectedAsset.type !== 'image') return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const source = selectedAsset.editedUrl || selectedAsset.sourceUrl;
      const enhanced = await gemini.enhanceImage(source, prompt, brand);
      updateMediaAsset(selectedAsset.id, { 
        editedUrl: enhanced,
        status: 'edited'
      });
      showSuccess(t.lab.enhanceSuccess);
    } catch (e) {
      setError(t.lab.enhanceFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!selectedAsset || selectedAsset.type !== 'video') return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const result = await gemini.generateThumbnail(postDraft.mediaDescription || t.lab.videoContentDefault, brand, language);
      updateMediaAsset(selectedAsset.id, { 
        thumbnailUrl: result.url,
        status: 'edited'
      });
      setPostDraft(prev => ({ ...prev, hook: result.hook }));
      showSuccess(t.lab.thumbnailSuccess);
    } catch (e) {
      setError(t.lab.thumbnailFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDraftPost = async () => {
    if (!selectedAsset) return;
    
    setIsProcessing(true);
    try {
      const result = await gemini.draftPostFromMedia(
        selectedAsset.type as any,
        postDraft.mediaDescription || t.lab.marketingContentDefault,
        postDraft.platform,
        brand,
        language
      );
      setPostDraft(prev => ({
        ...prev,
        content: result.content,
        hook: result.hook
      }));
      setActiveTab('composer');
    } catch (e) {
      setError(t.lab.draftingFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToPlanner = () => {
    if (!selectedAsset) return;
    
    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      platform: postDraft.platform,
      topic: postDraft.mediaDescription || t.lab.mediaLabPostDefault,
      content: postDraft.content,
      hook: postDraft.hook,
      imageBrief: postDraft.mediaDescription || t.lab.mediaLabPostDefault,
      imagePreviewUrl: selectedAsset.type === 'image' ? (selectedAsset.editedUrl || selectedAsset.sourceUrl) : (selectedAsset.thumbnailUrl || ''),
      videoUrl: selectedAsset.type === 'video' ? selectedAsset.sourceUrl : undefined,
      status: 'scheduled',
      dayIndex: postDraft.dayIndex,
      weekIndex: 0,
      isApproved: true,
      hashtags: [],
      signatureEnabled: true
    };
    
    addPost(newPost);

    triggerOutboundEvent({
      eventType: 'post_scheduled',
      platform: newPost.platform,
      postId: newPost.id,
      content: newPost.content,
      assetUrl: newPost.imagePreviewUrl,
      sourceModule: 'media-lab',
      metadata: {
        dayIndex: newPost.dayIndex,
        topic: newPost.topic
      }
    });

    showSuccess(t.lab.plannerSuccess, 1500, () => setActiveView('planner'));
  };

  if (!brand) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center glass-panel p-12 rounded-3xl">
        <RefreshCw className="w-12 h-12 text-[#C74CFF] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-orbitron uppercase text-white/40 tracking-[0.4em]">Initializing Media Lab...</h2>
      </div>
    </div>
  );

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto h-full flex flex-col bg-[#0A0A12]">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black font-orbitron tracking-tight text-[#34E0F7]">
            MEDIA <span className="text-white">LAB</span>
          </h2>
          <p className="text-[10px] font-orbitron text-white/20 uppercase tracking-[0.3em]">{t.lab.desc}</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            multiple 
            accept="image/*,video/*"
          />
          <NeonButton variant="cyan" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} className="mr-2" /> {t.lab.uploadAssets}
          </NeonButton>
          <NeonButton variant="purple" onClick={() => setShowDNAImport(true)}>
            <Dna size={18} className="mr-2" /> {t.brandKit.referenceImages}
          </NeonButton>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left Sidebar: Library */}
        <aside className="lg:col-span-3 flex flex-col space-y-4 min-h-0">
          <div className="glass-panel p-4 rounded-2xl border-white/5 flex-1 flex flex-col min-h-0">
            <h3 className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-4 flex items-center justify-between">
              {t.lab.assetLibrary}
              <span className="text-[#34E0F7]">{mediaAssets.length}</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {mediaAssets.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-white/5 rounded-xl">
                  <ImageIcon size={24} className="text-white/10 mb-2" />
                  <p className="text-[8px] font-orbitron text-white/20 uppercase">{t.lab.noAssets}</p>
                </div>
              ) : (
                mediaAssets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`w-full group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedAssetId === asset.id ? 'border-[#34E0F7] shadow-[0_0_15px_rgba(52,224,247,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    {asset.type === 'image' ? (
                      <img src={asset.sourceUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <VideoIcon size={24} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); removeMediaAsset(asset.id); }} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40">
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="lg:col-span-9 flex flex-col space-y-6 min-h-0">
          {!selectedAsset ? (
            <div className="flex-1 glass-panel rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center p-12">
              <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                <Sparkles size={64} className="text-white/10" />
              </div>
              <h3 className="text-2xl font-black font-orbitron text-white uppercase tracking-widest mb-4">{t.lab.selectAsset}</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto mb-8">
                {t.lab.selectAssetDesc}
              </p>
              <NeonButton variant="cyan" onClick={() => fileInputRef.current?.click()}>
                {t.lab.startForging}
              </NeonButton>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-6 min-h-0">
              {/* Tabs */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('workspace')}
                  className={`px-6 py-3 rounded-xl font-orbitron text-[10px] uppercase tracking-widest transition-all ${activeTab === 'workspace' ? 'bg-[#34E0F7] text-black font-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {t.lab.workspace}
                </button>
                <button 
                  onClick={() => setActiveTab('composer')}
                  className={`px-6 py-3 rounded-xl font-orbitron text-[10px] uppercase tracking-widest transition-all ${activeTab === 'composer' ? 'bg-[#8C4DFF] text-white font-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {t.lab.postComposer}
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                {/* Preview Area */}
                <div className="flex flex-col space-y-4 min-h-0">
                  <div className="flex-1 glass-panel rounded-3xl border-white/5 overflow-hidden relative group">
                    {selectedAsset.type === 'image' ? (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 relative overflow-hidden">
                           {/* Before/After Toggle or Split View */}
                           <img 
                             src={selectedAsset.editedUrl || selectedAsset.sourceUrl} 
                             className="w-full h-full object-contain" 
                             alt="Preview" 
                           />
                           {selectedAsset.editedUrl && (
                             <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-orbitron text-[#34E0F7] uppercase tracking-widest">
                               {t.lab.editedVersion}
                             </div>
                           )}
                        </div>
                        {selectedAsset.editedUrl && (
                           <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[8px] font-orbitron text-white/20 uppercase">{t.lab.comparisonActive}</span>
                              <button 
                                onClick={() => updateMediaAsset(selectedAsset.id, { editedUrl: undefined, status: 'original' })}
                                className="text-[8px] font-orbitron text-red-500 uppercase hover:underline"
                              >
                                {t.lab.revertOriginal}
                              </button>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 bg-black flex items-center justify-center relative">
                           <video src={selectedAsset.sourceUrl} controls className="max-w-full max-h-full" />
                        </div>
                        {selectedAsset.thumbnailUrl && (
                          <div className="p-4 bg-black/40 border-t border-white/5">
                             <div className="flex items-center gap-4">
                                <div className="w-20 aspect-video rounded-lg overflow-hidden border border-white/10">
                                   <img src={selectedAsset.thumbnailUrl} className="w-full h-full object-cover" alt="Thumbnail" />
                                </div>
                                <div className="flex-1">
                                   <p className="text-[8px] font-orbitron text-[#34E0F7] uppercase tracking-widest mb-1">{t.lab.genThumbnail}</p>
                                   <p className="text-[10px] text-white/40 italic">"{postDraft.hook}"</p>
                                </div>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls Area */}
                <div className="flex flex-col space-y-6 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                  {activeTab === 'workspace' ? (
                    <div className="space-y-6">
                      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                        <h4 className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-widest">{t.lab.aiOps}</h4>
                        
                        {selectedAsset.type === 'image' ? (
                          <div className="grid grid-cols-1 gap-3">
                            <button 
                              onClick={() => handleEnhanceImage(t.lab.autoEnhancePrompt)}
                              disabled={isProcessing}
                              className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#34E0F7]/30 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#34E0F7]/10 flex items-center justify-center text-[#34E0F7]">
                                  <Sparkles size={18} />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-white">{t.lab.autoEnhance}</p>
                                  <p className="text-[8px] text-white/40 uppercase">{t.lab.qualityLighting}</p>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono text-white/20">10 {t.common.creditsAbbr}</span>
                            </button>

                            <div className="space-y-2">
                               <textarea 
                                 placeholder={t.lab.customAiEditPlaceholder}
                                 className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-[#34E0F7] min-h-[80px]"
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     handleEnhanceImage(e.currentTarget.value);
                                   }
                                 }}
                               />
                               <p className="text-[8px] font-mono text-white/20 uppercase text-right">{t.lab.pressEnter}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                               <label className="text-[8px] font-orbitron text-white/40 uppercase tracking-widest">{t.lab.videoContext}</label>
                               <textarea 
                                 value={postDraft.mediaDescription}
                                 onChange={e => setPostDraft(prev => ({ ...prev, mediaDescription: e.target.value }))}
                                 placeholder={t.lab.videoContextPlaceholder}
                                 className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-[#34E0F7] min-h-[80px]"
                               />
                            </div>
                            <button 
                              onClick={handleGenerateThumbnail}
                              disabled={isProcessing}
                              className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#34E0F7]/30 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#34E0F7]/10 flex items-center justify-center text-[#34E0F7]">
                                  <ImageIcon size={18} />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-white">{t.lab.genThumbnail}</p>
                                  <p className="text-[8px] text-white/40 uppercase">{t.lab.aiAssistedVisual}</p>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono text-white/20">15 {t.common.creditsAbbr}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                        <h4 className="text-[10px] font-orbitron text-[#8C4DFF] uppercase tracking-widest">{t.lab.nextStep}</h4>
                        <NeonButton 
                          variant="purple" 
                          className="w-full py-4"
                          onClick={handleDraftPost}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <RefreshCw className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                          {t.lab.draftPostFromMedia}
                        </NeonButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                        <h4 className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-widest">{t.lab.postDetails}</h4>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[8px] font-orbitron text-white/40 uppercase tracking-widest">{t.lab.hookOverlay}</label>
                            <input 
                              type="text"
                              value={postDraft.hook}
                              onChange={e => setPostDraft(prev => ({ ...prev, hook: e.target.value }))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-[#34E0F7]"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[8px] font-orbitron text-white/40 uppercase tracking-widest">{t.lab.captionContent}</label>
                            <textarea 
                              value={postDraft.content}
                              onChange={e => setPostDraft(prev => ({ ...prev, content: e.target.value }))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-[#34E0F7] min-h-[150px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
                        <h4 className="text-[10px] font-orbitron text-[#34E0F7] uppercase tracking-widest">{t.lab.scheduleDestination}</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[8px] font-orbitron text-white/40 uppercase tracking-widest">{t.lab.platform}</label>
                            <select 
                              value={postDraft.platform}
                              onChange={e => setPostDraft(prev => ({ ...prev, platform: e.target.value as any }))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                            >
                              <option value="instagram">{t.common.instagram}</option>
                              <option value="facebook">{t.common.facebook}</option>
                              <option value="linkedin">{t.common.linkedin}</option>
                              <option value="tiktok">{t.common.tiktok}</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-orbitron text-white/40 uppercase tracking-widest">{t.lab.day}</label>
                            <select 
                              value={postDraft.dayIndex}
                              onChange={e => setPostDraft(prev => ({ ...prev, dayIndex: parseInt(e.target.value) }))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                            >
                              {[...Array(7)].map((_, i) => (
                                <option key={i} value={i}>{t.days[Object.keys(t.days)[i] as keyof typeof t.days]}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <NeonButton 
                          variant="cyan" 
                          className="w-full py-4 mt-4"
                          onClick={handleSendToPlanner}
                        >
                          <Send size={18} className="mr-2" /> {t.lab.sendToPlanner}
                        </NeonButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 p-4 rounded-2xl glass-panel flex items-center gap-3 z-[100] border border-[#34E0F7]/50 shadow-[0_0_30px_rgba(52,224,247,0.2)] text-[#34E0F7]"
          >
            <CheckCircle2 size={20} />
            <span className="font-orbitron text-xs uppercase tracking-wider">{successMsg}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 p-4 rounded-2xl glass-panel flex items-center gap-3 z-[100] border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] text-red-500"
          >
            <span className="font-orbitron text-xs uppercase tracking-wider">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-white/40 hover:text-white">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand DNA Import Modal */}
      <AnimatePresence>
        {showDNAImport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDNAImport(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass-panel rounded-[2.5rem] border-white/10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Dna size={24} className="text-[#34E0F7]" />
                  <h3 className="text-xl font-black font-orbitron text-white uppercase tracking-widest">
                    {t.brandKit.referenceImages}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowDNAImport(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <Plus size={24} className="rotate-45 text-white/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {(brand.referenceImages || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ImageIcon size={48} className="text-white/10 mb-4" />
                    <p className="text-white/40 font-orbitron uppercase tracking-widest">{t.brandKit.noReferenceAssets}</p>
                    <button 
                      onClick={() => { setShowDNAImport(false); setActiveView('brand-kit'); }}
                      className="mt-4 text-[#34E0F7] text-xs font-orbitron uppercase hover:underline"
                    >
                      {t.brandKit.goToBrandKit}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(brand.referenceImages || []).map((img) => (
                      <div 
                        key={img.id}
                        onClick={() => handleImportFromDNA(img)}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-[#34E0F7]/50 transition-all"
                      >
                        <img src={img.imageUrl} className="w-full h-full object-cover" alt={img.title} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                          <p className="text-[10px] font-black font-orbitron text-white uppercase mb-1">{img.title}</p>
                          <div className="flex flex-wrap justify-center gap-1">
                            {img.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[6px] px-1 py-0.5 bg-[#34E0F7]/20 text-[#34E0F7] rounded uppercase">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 p-2 bg-[#34E0F7] text-black rounded-lg">
                            <Plus size={16} />
                          </div>
                        </div>
                        {img.priority === 'primary' && (
                          <div className="absolute top-2 left-2 p-1 bg-[#34E0F7] text-black rounded-md shadow-lg">
                            <Star size={10} fill="currentColor" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaLab;
