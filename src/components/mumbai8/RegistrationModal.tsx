import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Train, ArrowRight, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import type { PassengerRole, RegistrationInput } from '../../types/mumbai8';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: RegistrationInput, autoApprove: boolean) => void;
}

const ROLES: PassengerRole[] = [
  'Builder',
  'Developer',
  'Founder',
  'Creator',
  'Student',
  'Designer',
  'Investor',
  'Community',
  'Other',
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [xHandle, setXHandle] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<PassengerRole>('Builder');
  const [bio, setBio] = useState('');
  const [isSubmittedReview, setIsSubmittedReview] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (autoApprove: boolean) => {
    if (!fullName.trim() || !city.trim() || !xHandle.trim()) {
      alert('Please fill in required fields: Full Name, City, and X/Twitter handle.');
      return;
    }

    const input: RegistrationInput = {
      fullName: fullName.trim(),
      city: city.trim(),
      country: country.trim(),
      xHandle: xHandle.trim(),
      githubUrl: githubUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      role,
      bio: bio.trim() || undefined,
    };

    onSubmit(input, autoApprove);

    if (!autoApprove) {
      setIsSubmittedReview(true);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-500/40 bg-[#090D18] p-6 sm:p-8 shadow-2xl shadow-cyan-950/80 z-10 my-auto"
        >
          {/* Top ambient lighting line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>

          {!isSubmittedReview ? (
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
                <Train className="h-4 w-4" />
                <span>MUMBAI8 &bull; PASSENGER ONBOARDING</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                WELCOME ABOARD MUMBAI8
              </h2>
              <p className="text-sm text-slate-300 font-light mt-1">
                Tell us who you are. Approved attendees are assigned their unique sequential onchain seat number.
              </p>

              {/* Registration Form */}
              <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Najish Anjum"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      X / Twitter Handle *
                    </label>
                    <input
                      type="text"
                      value={xHandle}
                      onChange={(e) => setXHandle(e.target.value)}
                      placeholder="@Najish_anjum"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bhopal / Mumbai / Delhi"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
                    Primary Role / Focus
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`rounded-xl border py-2 px-3 text-xs font-medium transition ${
                          role === r
                            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold shadow-md shadow-cyan-500/20'
                            : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/..."
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      Website / Portfolio
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    Profile Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    Short Bio (What are you hacking or building?)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief intro..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-xs font-mono text-slate-300 hover:border-cyan-400 hover:text-white transition"
                >
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <span>SUBMIT FOR REVIEW (QUEUE)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 hover:scale-105 transition"
                >
                  <Zap className="h-4 w-4" />
                  <span>INSTANT BOARD & GET SEAT</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Review Status Screen */
            <div className="py-6 text-center space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight uppercase">
                  APPLICATION SUBMITTED
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto">
                  Your registration for MUMBAI8 has been received and is currently under review by the Mumbai Onchain team.
                </p>
              </div>

              {/* Status Timeline */}
              <div className="max-w-md mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left space-y-4">
                <span className="font-mono text-xs uppercase text-slate-400 block border-b border-white/10 pb-2">
                  APPLICATION STATUS
                </span>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>&bull; Submitted ({new Date().toLocaleDateString()})</span>
                  </div>
                  <div className="flex items-center gap-3 text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>&bull; Under Review by Admins</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-700" />
                    <span>○ Seat Assignment (MUM-XXXX)</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-700" />
                    <span>○ Boarding Pass Issued</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-mono text-white hover:bg-white/10 transition"
                >
                  RETURN TO TRAIN
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
