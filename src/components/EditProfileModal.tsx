import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import type { PersonProfile, PersonCategory } from '../types/person';
import type { EventItem } from '../types/event';
import { PersonAvatar } from './PersonAvatar';

interface EditProfileModalProps {
  isOpen: boolean;
  currentProfile: PersonProfile | null;
  events: EventItem[];
  onClose: () => void;
  onSave: (profileData: Partial<PersonProfile>) => void;
}

const CATEGORIES: PersonCategory[] = [
  'Builder',
  'Founder',
  'Volunteer',
  'Student',
  'Attendee',
  'Other',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
];

const QUICK_CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'San Francisco', 'London', 'Berlin', 'Singapore'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  currentProfile,
  events,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [category, setCategory] = useState<PersonCategory>('Builder');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [attendingEvents, setAttendingEvents] = useState<string[]>(['devcon-8-india']);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize state when modal opens or profile changes
  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || '');
      setCity(currentProfile.city || 'Mumbai');
      setCategory(currentProfile.category || 'Builder');
      setBio(currentProfile.bio || '');
      setAvatar(currentProfile.avatar || '');
      setXHandle(currentProfile.xHandle || '');
      setGithubUrl(currentProfile.githubUrl || '');
      setLinkedinUrl(currentProfile.linkedinUrl || '');
      setAttendingEvents(currentProfile.attendingEvents || ['devcon-8-india']);
    } else {
      setName('');
      setCity('Mumbai');
      setCategory('Builder');
      setBio('');
      setAvatar('');
      setXHandle('');
      setGithubUrl('');
      setLinkedinUrl('');
      setAttendingEvents(['devcon-8-india']);
    }
    setError(null);
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  // Handle Photo upload as Base64 for LocalStorage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Photo size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setAvatar(result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle attending event checkbox
  const toggleEvent = (eventId: string) => {
    setAttendingEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSelectAllEvents = () => {
    setAttendingEvents(events.map(e => e.id));
  };

  const handleClearAllEvents = () => {
    setAttendingEvents([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!city.trim()) {
      setError('Please enter your city.');
      return;
    }

    onSave({
      name: name.trim(),
      city: city.trim(),
      category,
      bio: bio.trim(),
      avatar: avatar.trim(),
      xHandle: xHandle.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      attendingEvents,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border-2 border-[#000000] shadow-2xl z-10 my-8 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#FFFFFF] border-b-2 border-[#000000] p-5 sm:p-6 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-widest">
              COMMUNITY DIRECTORY
            </div>
            <h3 className="font-heading font-black text-2xl text-[#050505] tracking-tight">
              {currentProfile ? 'EDIT YOUR PROFILE' : 'CREATE COMMUNITY PROFILE'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626] font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Section */}
          <div className="space-y-3 border-b border-[#EAEAEA] pb-6">
            <label className="block font-mono text-xs font-bold text-[#050505] uppercase tracking-wider">
              PROFILE PHOTO (OPTIONAL)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <PersonAvatar
                name={name || 'Your Name'}
                avatarUrl={avatar}
                size="lg"
                className="border-2 border-[#000000]"
              />

              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#000000] text-[#FFFFFF] font-mono text-xs font-bold hover:bg-[#222222] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>UPLOAD PHOTO</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="px-3 py-1.5 border border-[#DC2626] text-[#DC2626] font-mono text-xs font-bold hover:bg-[#DC2626] hover:text-[#FFFFFF] transition-colors"
                    >
                      REMOVE
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[#666666]">
                  Or choose a preset avatar:
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-8 h-8 rounded-none border overflow-hidden transition-all ${
                        avatar === url ? 'border-2 border-[#000000] scale-110' : 'border-[#D8D8D8] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Name & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold text-[#050505] uppercase tracking-wider">
                FULL NAME *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Satoshi Nakamoto"
                required
                className="w-full p-2.5 bg-[#FAFAFA] border border-[#000000] font-mono text-xs focus:outline-none focus:bg-[#FFFFFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold text-[#050505] uppercase tracking-wider">
                CITY / BASE *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                required
                className="w-full p-2.5 bg-[#FAFAFA] border border-[#000000] font-mono text-xs focus:outline-none focus:bg-[#FFFFFF]"
              />
              <div className="flex items-center gap-1 flex-wrap pt-1">
                {QUICK_CITIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className="font-mono text-[10px] bg-[#F0F0F0] hover:bg-[#000000] hover:text-[#FFFFFF] px-1.5 py-0.5 border border-[#D8D8D8] transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block font-mono text-xs font-bold text-[#050505] uppercase tracking-wider">
              COMMUNITY ROLE / CATEGORY *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 font-mono text-xs font-bold border transition-all text-left flex items-center justify-between ${
                    category === cat
                      ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                      : 'bg-[#FAFAFA] text-[#333333] border-[#D8D8D8] hover:border-[#000000]'
                  }`}
                >
                  <span>{cat}</span>
                  {category === cat && <Check className="w-3.5 h-3.5 text-[#FFFFFF]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Short Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-xs font-bold text-[#050505] uppercase tracking-wider">
                SHORT BIO
              </label>
              <span className="font-mono text-[11px] text-[#777777]">
                {bio.length}/280
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="What are you building, researching, or excited to explore during Mumbai Onchain Week?"
              className="w-full p-2.5 bg-[#FAFAFA] border border-[#000000] font-sans text-xs focus:outline-none focus:bg-[#FFFFFF] resize-none"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3 border-t border-[#EAEAEA] pt-5">
            <label className="block font-mono text-xs font-bold text-[#050505] uppercase tracking-wider">
              SOCIALS & LINKS
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-[#666666] font-bold">𝕏 (TWITTER) PROFILE</span>
                <input
                  type="text"
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value)}
                  placeholder="@handle or URL"
                  className="w-full p-2 bg-[#FAFAFA] border border-[#000000] text-xs focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#666666] font-bold">GITHUB USERNAME</span>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="github-username"
                  className="w-full p-2 bg-[#FAFAFA] border border-[#000000] text-xs focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#666666] font-bold">LINKEDIN (OPTIONAL)</span>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/..."
                  className="w-full p-2 bg-[#FAFAFA] border border-[#000000] text-xs focus:outline-none focus:bg-[#FFFFFF]"
                />
              </div>
            </div>
          </div>

          {/* Events Attending */}
          <div className="space-y-3 border-t border-[#EAEAEA] pt-5">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-xs font-bold text-[#050505] uppercase tracking-wider">
                EVENTS YOU ARE ATTENDING ({attendingEvents.length})
              </label>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllEvents}
                  className="hover:underline text-[#000000] font-bold"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAllEvents}
                  className="hover:underline text-[#666666]"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-[#E0E0E0] p-2 bg-[#FAFAFA]">
              {events.map(evt => {
                const isSelected = attendingEvents.includes(evt.id);
                return (
                  <div
                    key={evt.id}
                    onClick={() => toggleEvent(evt.id)}
                    className={`p-2 border cursor-pointer font-mono text-xs flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                        : 'bg-[#FFFFFF] text-[#333333] border-[#E0E0E0] hover:border-[#999999]'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#FFFFFF] bg-[#FFFFFF] text-[#000000]' : 'border-[#666666]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#000000]" />}
                    </div>
                    <span className="truncate flex-1 font-sans text-xs font-medium">
                      {evt.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t-2 border-[#000000] pt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#000000] font-mono text-xs font-bold hover:bg-[#F5F5F5] transition-colors"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#000000] text-[#FFFFFF] font-mono text-xs font-bold hover:bg-[#222222] transition-all active:scale-95 shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>SAVE & PUBLISH PROFILE</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
