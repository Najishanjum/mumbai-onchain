import React, { useState, useRef } from 'react';
import type { EventItem } from '../types/event';
import { useSnapStore } from '../lib/useSnapStore';
import { usePeopleStore } from '../lib/usePeopleStore';
import {
  X,
  Upload,
  Camera,
  Calendar,
  MapPin,
  Tag,
  Loader2,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface AddSnapModalProps {
  isOpen: boolean;
  events: EventItem[];
  preselectedEventId?: string;
  onClose: () => void;
}

export const AddSnapModal: React.FC<AddSnapModalProps> = ({
  isOpen,
  events,
  preselectedEventId,
  onClose,
}) => {
  const { addSnap } = useSnapStore();
  const { people } = usePeopleStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || 'devcon-8-india');
  const [date, setDate] = useState<string>('Nov 4, 2026');
  const [caption, setCaption] = useState<string>('');
  const [location, setLocation] = useState<string>('Jio World Centre, BKC');
  const [taggedPersonIds, setTaggedPersonIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size is too large (max 15MB).');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleTag = (personId: string) => {
    setTaggedPersonIds(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setErrorMessage('Please select an image for your Snap.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const matchedEvent = events.find(ev => ev.id === selectedEventId);
      const eventName = matchedEvent ? matchedEvent.title : 'Mumbai Onchain Week';

      await addSnap({
        file: selectedFile || undefined,
        imageDataUrl: previewUrl,
        eventId: selectedEventId,
        eventName,
        date: date.trim() || 'Nov 2026',
        caption: caption.trim(),
        location: location.trim(),
        taggedPersonIds,
      });

      onClose();
    } catch (err: any) {
      console.error('Error saving Snap:', err);
      setErrorMessage(err.message || 'Failed to compress and save Snap. Try a smaller photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150"
      role="dialog"
      aria-label="Add Snap Modal"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[#FFFFFF] border-2 border-[#000000] p-6 space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#000000] pb-4">
          <div className="space-y-0.5">
            <div className="font-mono text-[10px] text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
              <span>VISUAL EVENT MEMORY</span>
              <span>•</span>
              <span className="text-[#F97316] font-bold">SNAPSHOT</span>
            </div>
            <h2 className="font-heading font-black text-xl text-[#000000] uppercase tracking-tight flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#F97316]" />
              <span>+ ADD SNAP</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload & Preview Zone */}
          <div className="space-y-1.5">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              1. UPLOAD PHOTO <span className="text-red-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-2">
                <div className="relative border-2 border-[#000000] bg-[#000000] rounded overflow-hidden max-h-56 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Snap Preview"
                    className="w-full h-56 object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 border border-[#000000] bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>CHANGE IMAGE</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="py-1.5 px-3 border border-red-500 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>REMOVE</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#000000] p-8 text-center cursor-pointer hover:bg-[#F9F9F9] transition-colors bg-[#FAFAFA]"
              >
                <Camera className="w-8 h-8 text-[#555555] mx-auto mb-2" />
                <div className="font-heading font-black text-sm text-[#000000] uppercase">
                  CLICK TO SELECT OR TAKE PHOTO
                </div>
                <p className="font-mono text-[11px] text-[#777777] mt-1">
                  Stage, builders, Devcon moments, hackathons, or Mumbai cityscapes
                </p>
              </div>
            )}
          </div>

          {/* Event Selection */}
          <div className="space-y-1">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              2. ASSOCIATED EVENT
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-2.5 bg-[#FFFFFF] border-2 border-[#000000] font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#000000]"
            >
              <option value="devcon-8-india">Devcon 8 India (Flagship)</option>
              <option value="ethglobal-mumbai-2026">ETHGlobal Mumbai Hackathon</option>
              <option value="india-blockchain-week-2026">India Blockchain Week (IBW)</option>
              {events
                .filter(e => !['devcon-8-india', 'ethglobal-mumbai-2026', 'india-blockchain-week-2026'].includes(e.id))
                .slice(0, 15)
                .map(e => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Date & Location inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-xs font-bold text-[#000000] uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#F97316]" />
                <span>DATE</span>
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Nov 4, 2026"
                className="w-full p-2 border border-[#000000] font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-xs font-bold text-[#000000] uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#22C55E]" />
                <span>LOCATION</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jio World Centre, BKC"
                className="w-full p-2 border border-[#000000] font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Short Caption */}
          <div className="space-y-1">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase block">
              3. CAPTION (KEEP IT SHORT)
            </label>
            <input
              type="text"
              maxLength={120}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Hackathon stage after final submission..."
              className="w-full p-2 border border-[#000000] font-sans text-xs focus:outline-none"
            />
          </div>

          {/* Tag People in this Snap */}
          <div className="space-y-1.5">
            <label className="font-mono text-xs font-bold text-[#000000] uppercase flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#9333EA]" />
              <span>TAG PEOPLE IN THIS SNAP (OPTIONAL)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[#FAFAFA] border border-[#E5E5E5]">
              {people.slice(0, 10).map(person => {
                const isTagged = taggedPersonIds.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleToggleTag(person.id)}
                    className={`px-2 py-1 text-[11px] font-mono rounded border transition-all ${
                      isTagged
                        ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                        : 'bg-[#FFFFFF] text-[#444444] border-[#D4D4D4] hover:border-[#000000]'
                    }`}
                  >
                    <span>{isTagged ? '✓ ' : '+ '}@{person.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EAEAEA]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-[#000000] text-xs font-mono font-bold hover:bg-[#F0F0F0] transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !previewUrl}
              className="px-6 py-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] text-xs font-heading font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(249,115,22,1)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>OPTIMIZING & SAVING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>PUBLISH SNAP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
