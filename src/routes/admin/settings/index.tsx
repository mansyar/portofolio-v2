import { useState, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Terminal, Save, Globe, Share2, Info, Loader2 } from 'lucide-react';
import { useToastMutation } from '@/hooks/use-toast-mutation';

export const Route = createFileRoute('/admin/settings/')({
  component: AdminSettings,
});

function AdminSettings() {
  const currentSettings = useQuery(api.settings.getAll);
  const setBulk = useToastMutation(api.settings.setBulk, {
    loadingMessage: "Saving system configurations...",
    successMessage: "System configurations updated successfully.",
    errorMessage: "Failed to save configurations.",
  });


  const [localSettings, setLocalSettings] = useState<Record<string, string> | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'social'>('general');

  const settings = useMemo(() => {
    const defaults = {
      siteTitle: '',
      metaDescription: '',
      defaultOgImage: '',
      socialTwitter: '',
      socialLinkedIn: '',
      socialGitHub: '',
    };
    if (localSettings) return localSettings;
    if (currentSettings) return { ...defaults, ...currentSettings };
    return defaults;
  }, [currentSettings, localSettings]);

  const updateSetting = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...(prev || settings),
      [key]: value,
    }));
  };

  const handleSave = async () => {
    await setBulk.mutate({ settings });
  };

  if (!currentSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--color-ubuntu-orange)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <Terminal className="text-(--color-ubuntu-orange)" />
            SYSTEM_CONFIG
          </h1>
          <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
            Environment management and global variables
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={setBulk.isPending}
          className="terminal-button btn-primary flex items-center justify-center gap-2"
        >
          {setBulk.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>APPLY_CHANGES</span>
        </button>
      </div>

      <div className="terminal-card overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-(--color-border) bg-[rgba(255,255,255,0.02)]">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-mono text-sm transition-colors border-r border-(--color-border) ${
              activeTab === 'general' ? 'bg-(--color-surface) text-(--color-ubuntu-orange)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
          >
            <span className="flex items-center gap-2">
              <Info size={14} />
              GENERAL
            </span>
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`px-6 py-3 font-mono text-sm transition-colors border-r border-(--color-border) ${
              activeTab === 'seo' ? 'bg-(--color-surface) text-(--color-ubuntu-orange)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
          >
            <span className="flex items-center gap-2">
              <Globe size={14} />
              SEO_DEFAULTS
            </span>
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`px-6 py-3 font-mono text-sm transition-colors ${
              activeTab === 'social' ? 'bg-(--color-surface) text-(--color-ubuntu-orange)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
          >
            <span className="flex items-center gap-2">
              <Share2 size={14} />
              SOCIAL_LINKS
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-(--color-ubuntu-orange) uppercase tracking-wider">
                  &gt; Site Title
                </label>
                <input
                  type="text"
                  value={settings.siteTitle}
                  onChange={e => updateSetting('siteTitle', e.target.value)}
                  className="terminal-input w-full"
                  placeholder="e.g. Ansyar's Portfolio"
                />
                <p className="text-[10px] text-(--color-text-secondary) font-mono italic">
                  Variable: siteTitle - Used in browser tabs and titles
                </p>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-(--color-ubuntu-orange) uppercase tracking-wider">
                  &gt; Global Meta Description
                </label>
                <textarea
                  value={settings.metaDescription}
                  onChange={e => updateSetting('metaDescription', e.target.value)}
                  className="terminal-input w-full min-h-[100px] py-2"
                  placeholder="Default SEO description for the entire site"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-(--color-ubuntu-orange) uppercase tracking-wider">
                  &gt; Default OG Image URL
                </label>
                <input
                  type="text"
                  value={settings.defaultOgImage}
                  onChange={e => updateSetting('defaultOgImage', e.target.value)}
                  className="terminal-input w-full"
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-[10px] text-(--color-text-secondary) font-mono italic">
                  Recommended size: 1200x630px
                </p>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-(--color-ubuntu-orange) uppercase tracking-wider">
                      &gt; Twitter URL
                    </label>
                    <input
                      type="text"
                      value={settings.socialTwitter}
                      onChange={e => updateSetting('socialTwitter', e.target.value)}
                      className="terminal-input w-full"
                      placeholder="https://x.com/username"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-(--color-ubuntu-orange) uppercase tracking-wider">
                      &gt; LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={settings.socialLinkedIn}
                      onChange={e => updateSetting('socialLinkedIn', e.target.value)}
                      className="terminal-input w-full"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-(--color-ubuntu-orange) uppercase tracking-wider">
                      &gt; GitHub URL
                    </label>
                    <input
                      type="text"
                      value={settings.socialGitHub}
                      onChange={e => updateSetting('socialGitHub', e.target.value)}
                      className="terminal-input w-full"
                      placeholder="https://github.com/username"
                    />
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 bg-black/20 font-mono text-xs text-(--color-text-secondary)">
        <p className="flex items-center gap-2">
          <Info size={14} className="text-(--color-terminal-yellow)" />
          <span>Note: Changes here affect the global state. Public routes will reactively update.</span>
        </p>
      </div>
    </div>
  );
}
