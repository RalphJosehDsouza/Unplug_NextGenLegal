import { useState } from 'react';
import { Palette, Loader2, Download, RefreshCw, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axios';

const STYLE_OPTIONS = [
  { id: 'minimalist', label: 'Minimalist', emoji: '◻️' },
  { id: 'bold', label: 'Bold', emoji: '🔥' },
  { id: 'elegant', label: 'Elegant', emoji: '✨' },
  { id: 'playful', label: 'Playful', emoji: '🎯' },
];

const COLOR_PALETTES = [
  { name: 'RedBlack', colors: ['#dc2626', '#1f2937'] },
  { name: 'BlueSky', colors: ['#2563eb', '#60a5fa'] },
  { name: 'GreenNature', colors: ['#059669', '#34d399'] },
  { name: 'PurpleGold', colors: ['#7c3aed', '#f59e0b'] },
  { name: 'OrangeWarm', colors: ['#ea580c', '#fbbf24'] },
  { name: 'TealCool', colors: ['#0d9488', '#06b6d4'] },
];

const ICON_PREFS = [
  { id: 'lettermark', label: 'Lettermark', desc: 'Initials-based' },
  { id: 'abstract', label: 'Abstract', desc: 'Geometric shapes' },
  { id: 'icon', label: 'Icon', desc: 'Symbol + text' },
  { id: 'text_only', label: 'Text Only', desc: 'Stylized text' },
];

export function LogoMaker() {
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [style, setStyle] = useState('minimalist');
  const [colors, setColors] = useState(['#dc2626', '#1f2937']);
  const [iconPref, setIconPref] = useState('lettermark');
  const [loading, setLoading] = useState(false);
  const [logos, setLogos] = useState<any[]>([]);
  const [darkBg, setDarkBg] = useState(false);

  const handleGenerate = async () => {
    if (!businessName) { toast.error('Business name is required'); return; }
    setLoading(true);
    try {
      const resp = await api.post('/api/logo/generate', { business_name: businessName, industry, style, colors, icon_preference: iconPref });
      setLogos(resp.data.data || []);
      toast.success(`Generated ${resp.data.data?.length || 0} logo variations!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Logo generation failed');
    } finally { setLoading(false); }
  };

  const downloadSvg = (svg: string, idx: number) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${businessName.replace(/\s/g, '_')}_logo_${idx + 1}.svg`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <section className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">Logo Maker</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">AI <span className="text-red-600">Logo Designer</span></h1>
          <p className="text-gray-600">Generate professional SVG logos for your brand in seconds</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g., NextGenLegal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} className="block w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g., Legal Technology" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`px-4 py-2 rounded-xl text-sm border-2 transition-all ${style === s.id ? 'border-red-600 bg-red-50 font-medium' : 'border-gray-100 hover:border-red-300'}`}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color Palette</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_PALETTES.map(p => (
                <button key={p.name} onClick={() => setColors(p.colors)}
                  className={`flex gap-1 p-2 rounded-xl border-2 transition-all ${JSON.stringify(colors) === JSON.stringify(p.colors) ? 'border-red-600' : 'border-gray-100'}`}>
                  {p.colors.map(c => <div key={c} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ICON_PREFS.map(p => (
                <button key={p.id} onClick={() => setIconPref(p.id)}
                  className={`p-3 rounded-xl border-2 text-sm text-center transition-all ${iconPref === p.id ? 'border-red-600 bg-red-50' : 'border-gray-100'}`}>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Designing your brand...</> : <><Palette className="w-5 h-5 mr-2" /> Create Logos</>}
          </Button>
        </div>

        {logos.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{logos.length} Variations</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDarkBg(!darkBg)}>
                  {darkBg ? <Sun className="w-4 h-4 mr-1" /> : <Moon className="w-4 h-4 mr-1" />}
                  {darkBg ? 'Light' : 'Dark'} BG
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> More
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {logos.map((logo, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all">
                  <div className={`p-8 flex items-center justify-center min-h-[200px] ${darkBg ? 'bg-gray-900' : 'bg-gray-50'}`}
                    dangerouslySetInnerHTML={{ __html: logo.svg_data }} />
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500 capitalize">{logo.style_description}</span>
                    <Button variant="outline" size="sm" onClick={() => downloadSvg(logo.svg_data, i)}>
                      <Download className="w-4 h-4 mr-1" /> SVG
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
