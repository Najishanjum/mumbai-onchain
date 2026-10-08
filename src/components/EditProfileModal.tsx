import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertCircle, Shield, Sparkles, Wrench, Target } from 'lucide-react';
import type { PersonProfile, PersonCategory, ProfilePrivacySettings } from '../types/person';
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

const QUICK_SKILLS = ['Solidity', 'Rust', 'TypeScript', 'AI Agents', 'ZK-SNARKs', 'React', 'Foundry', 'Python', 'Go', 'ERC-4337'];
const QUICK_INTERESTS = ['AI Agents', 'Ethereum', 'DevTools', 'Privacy', 'DeFi', 'Layer 2', 'Identity', 'Design', 'DAOs'];

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
  const [headline, setHeadline] = useState('');
  const [currentlyBuilding, setCurrentlyBuilding] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [skills, setSkills] = useState<string[]>(['Solidity', 'TypeScript']);
  const [interests, setInterests] = useState<string[]>(['Ethereum', 'AI Agents']);
  const [skillsInput, setSkillsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [farcasterHandle, setFarcasterHandle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [attendingEvents, setAttendingEvents] = useState<string[]>(['devcon-8-india']);
  const [privacy, setPrivacy] = useState<ProfilePrivacySettings>({
    profileVisibility: 'public',
    showSnaps: true,
    allowTagging: true,
    showEvents: true,
    showMatchScore: true,
  });
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize state when modal opens or profile changes
  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || '');
      setCity(currentProfile.city || 'Mumbai');
      setCategory(currentProfile.category || 'Builder');
      setHeadline(currentProfile.headline || '');
      setCurrentlyBuilding(currentProfile.currentlyBuilding || '');
      setLookingFor(currentProfile.lookingFor || '');
      setSkills(currentProfile.skills || ['Solidity', 'TypeScript']);
      setInterests(currentProfile.interests || ['Ethereum', 'AI Agents']);
      setBio(currentProfile.bio || '');
      setAvatar(currentProfile.avatar || '');
      setXHandle(currentProfile.xHandle || '');
      setGithubUrl(currentProfile.githubUrl || '');
      setLinkedinUrl(currentProfile.linkedinUrl || '');
      setTelegramHandle(currentProfile.telegramHandle || '');
      setFarcasterHandle(currentProfile.farcasterHandle || '');
      setWebsiteUrl(currentProfile.websiteUrl || '');
      setAttendingEvents(currentProfile.attendingEvents || ['devcon-8-india']);
      if (currentProfile.privacySettings) {
        setPrivacy(currentProfile.privacySettings);
      }
    } else {
      setName('');
      setCity('Mumbai');
      setCategory('Builder');
      setHeadline('');
      setCurrentlyBuilding('');
      setLookingFor('');
      setSkills(['Solidity', 'TypeScript', 'AI Agents']);
      setInterests(['Ethereum', 'AI Agents', 'DevTools']);
      setBio('');
      setAvatar('');
      setXHandle('');
      setGithubUrl('');
      setLinkedinUrl('');
      setTelegramHandle('');
      setFarcasterHandle('');
      setWebsiteUrl('');
      setAttendingEvents(['devcon-8-india']);
      setPrivacy({
        profileVisibility: 'public',
        showSnaps: true,
        allowTagging: true,
        showEvents: true,
        showMatchScore: true,
      });
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

  const handleToggleEvent = (eventId: string) => {
    setAttendingEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handleToggleSkill = (sk: string) => {
    setSkills(prev => prev.includes(sk) ? prev.filter(s => s !== sk) : [...prev, sk]);
  };

  const handleToggleInterest = (int: string) => {
    setInterests(prev => prev.includes(int) ? prev.filter(i => i !== int) : [...prev, int]);
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillsInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillsInput.trim())) {
        setSkills(prev => [...prev, skillsInput.trim()]);
      }
      setSkillsInput('');
    }
  };

  const handleAddCustomInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && interestsInput.trim()) {
      e.preventDefault();
      if (!interests.includes(interestsInput.trim())) {
        setInterests(prev => [...prev, interestsInput.trim()]);
      }
      setInterestsInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }

    onSave({
      name: name.trim(),
      city: city.trim() || 'Mumbai',
      category,
      headline: headline.trim(),
      currentlyBuilding: currentlyBuilding.trim(),
      lookingFor: lookingFor.trim(),
      skills,
      interests,
      bio: bio.trim(),
      avatar: avatar.trim(),
      xHandle: xHandle.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      telegramHandle: telegramHandle.trim(),
      farcasterHandle: farcasterHandle.trim(),
      websiteUrl: websiteUrl.trim(),
      attendingEvents,
      privacySettings: privacy,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-8 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#000000] pb-4">
          <div className="space-y-0.5">
            <div className="font-mono text-xs uppercase tracking-widest text-[#666666]">
              COMMUNITY DIRECTORY // ONCHAIN IDENTITY
            </div>
            <h2 className="font-heading font-black text-2xl text-[#000000] uppercase tracking-tight">
              {currentProfile ? 'EDIT BUILDER PROFILE' : 'CREATE YOUR PROFILE'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar & Photo Picker */}
          <div className="space-y-2 border-b border-[#EAEAEA] pb-4">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider block">
              1. PROFILE PHOTO / AVATAR
            </label>

            <div className="flex items-center gap-4 flex-wrap">
              <PersonAvatar avatarUrl={avatar} name={name || 'U'} size="lg" />

              <div className="space-y-2 flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#000000] text-[#FFFFFF] hover:bg-[#333333] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>UPLOAD LOCAL PHOTO</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[#666666] uppercase">PRESETS:</span>
                  {PRESET_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Preset"
                      onClick={() => setAvatar(url)}
                      className={`w-6 h-6 rounded-full cursor-pointer object-cover border ${
                        avatar === url ? 'border-[#000000] ring-2 ring-[#000000]' : 'border-[#CCCCCC]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
                FULL NAME / PSEUDONYM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma or satoshi.eth"
                className="w-full p-2.5 bg-[#FAFAFA] border-2 border-[#000000] font-mono text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
                ROLE / CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PersonCategory)}
                className="w-full p-2.5 bg-[#FAFAFA] border-2 border-[#000000] font-mono text-xs focus:bg-white focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City / Metro */}
          <div className="space-y-1">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              PRIMARY CITY / HUB
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {QUICK_CITIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`px-2 py-0.5 font-mono text-[10px] border transition-colors ${
                    city === c ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]' : 'bg-[#FAFAFA] text-[#444444] border-[#CCCCCC]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, India"
              className="w-full p-2 bg-[#FAFAFA] border border-[#000000] font-mono text-xs focus:bg-white focus:outline-none"
            />
          </div>

          {/* Headline */}
          <div className="space-y-1">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              HEADLINE
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. AI Builder · Core Contributor · Hacking at ETHGlobal"
              className="w-full p-2 bg-[#FAFAFA] border border-[#000000] font-mono text-xs focus:bg-white focus:outline-none"
            />
          </div>

          {/* CURRENTLY BUILDING & LOOKING FOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F9F9F9] border-2 border-[#000000]">
            <div className="space-y-1">
              <label className="font-mono text-xs font-bold text-[#000000] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>CURRENTLY BUILDING</span>
              </label>
              <textarea
                rows={2}
                value={currentlyBuilding}
                onChange={(e) => setCurrentlyBuilding(e.target.value)}
                placeholder="e.g. AI-powered GitHub repository intelligence for Web3"
                className="w-full p-2 bg-white border border-[#000000] font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-xs font-bold text-[#000000] uppercase flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#F97316]" />
                <span>LOOKING FOR</span>
              </label>
              <textarea
                rows={2}
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="e.g. Collaborators building AI agents & ZK provers"
                className="w-full p-2 bg-white border border-[#000000] font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* SKILLS */}
          <div className="space-y-1.5">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>SKILLS & DEV TOOLS</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {QUICK_SKILLS.map(sk => (
                <button
                  key={sk}
                  type="button"
                  onClick={() => handleToggleSkill(sk)}
                  className={`px-2 py-0.5 font-mono text-[10px] border transition-colors ${
                    skills.includes(sk)
                      ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                      : 'bg-[#FAFAFA] text-[#555555] border-[#CCCCCC]'
                  }`}
                >
                  {skills.includes(sk) ? '✓ ' : '+ '} {sk}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={handleAddCustomSkill}
              placeholder="Type custom skill and press Enter..."
              className="w-full p-2 bg-[#FAFAFA] border border-[#000000] font-mono text-xs focus:bg-white focus:outline-none"
            />
          </div>

          {/* INTERESTS */}
          <div className="space-y-1.5">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#9333EA]" />
              <span>INTERESTS & FOCUS AREAS</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {QUICK_INTERESTS.map(int => (
                <button
                  key={int}
                  type="button"
                  onClick={() => handleToggleInterest(int)}
                  className={`px-2 py-0.5 font-mono text-[10px] border transition-colors ${
                    interests.includes(int)
                      ? 'bg-[#6B21A8] text-[#FFFFFF] border-[#6B21A8] font-bold'
                      : 'bg-[#FAFAFA] text-[#555555] border-[#CCCCCC]'
                  }`}
                >
                  {interests.includes(int) ? '✓ ' : '+ '} {int}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              onKeyDown={handleAddCustomInterest}
              placeholder="Type custom interest and press Enter..."
              className="w-full p-2 bg-[#FAFAFA] border border-[#000000] font-mono text-xs focus:bg-white focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              SHORT BIO / INTRO
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are you hacking on during Mumbai Onchain Week?"
              className="w-full p-2.5 bg-[#FAFAFA] border border-[#000000] font-sans text-xs focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Social Coordinates */}
          <div className="space-y-2 border-t border-[#EAEAEA] pt-4">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              SOCIALS & LINKS
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                placeholder="X / Twitter handle (e.g. rahul_zk)"
                className="p-2 border border-[#CCCCCC] font-mono text-xs focus:border-[#000000]"
              />
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="GitHub profile URL"
                className="p-2 border border-[#CCCCCC] font-mono text-xs focus:border-[#000000]"
              />
              <input
                type="text"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="Telegram handle (@handle)"
                className="p-2 border border-[#CCCCCC] font-mono text-xs focus:border-[#000000]"
              />
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="LinkedIn URL"
                className="p-2 border border-[#CCCCCC] font-mono text-xs focus:border-[#000000]"
              />
            </div>
          </div>

          {/* Events Attending */}
          <div className="space-y-2 border-t border-[#EAEAEA] pt-4">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              ATTENDING EVENTS ({attendingEvents.length} SELECTED)
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-[#FAFAFA] border border-[#E5E5E5]">
              {events.slice(0, 16).map(evt => {
                const isSelected = attendingEvents.includes(evt.id);
                return (
                  <div
                    key={evt.id}
                    onClick={() => handleToggleEvent(evt.id)}
                    className={`p-2 border text-xs font-mono cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                        : 'bg-[#FFFFFF] text-[#444444] border-[#E5E5E5] hover:border-[#000000]'
                    }`}
                  >
                    <span className="truncate">{evt.title}</span>
                    <span className="text-[10px] shrink-0 font-bold ml-2">
                      {isSelected ? '✓ ATTENDING' : '+ SELECT'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRIVACY CONTROLS */}
          <div className="p-4 bg-[#F5F5F5] border border-[#000000] space-y-3">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#000000] uppercase">
              <Shield className="w-4 h-4 text-[#2563EB]" />
              <span>PRIVACY & VISIBILITY CONTROLS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.showSnaps}
                  onChange={(e) => setPrivacy(p => ({ ...p, showSnaps: e.target.checked }))}
                  className="rounded"
                />
                <span>Show my Snaps publicly</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.allowTagging}
                  onChange={(e) => setPrivacy(p => ({ ...p, allowTagging: e.target.checked }))}
                  className="rounded"
                />
                <span>Allow attendees to tag me</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.showEvents}
                  onChange={(e) => setPrivacy(p => ({ ...p, showEvents: e.target.checked }))}
                  className="rounded"
                />
                <span>Show my attending events</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.showMatchScore}
                  onChange={(e) => setPrivacy(p => ({ ...p, showMatchScore: e.target.checked }))}
                  className="rounded"
                />
                <span>Show networking match score</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#000000]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-[#000000] font-mono text-xs font-bold hover:bg-[#F0F0F0] transition-colors cursor-pointer"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] font-heading font-black text-xs uppercase tracking-wider border-2 border-[#000000] shadow-[3px_3px_0px_0px_rgba(249,115,22,1)] active:scale-98 transition-all cursor-pointer"
            >
              SAVE PROFILE
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
