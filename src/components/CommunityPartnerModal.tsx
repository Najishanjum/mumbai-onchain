import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  uploadCommunityLogo,
  submitCommunityPartnerApplication,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  formatSocialUrl,
} from '../lib/communityPartner';

interface CommunityPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityPartnerModal: React.FC<CommunityPartnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Form fields
  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [leadName, setLeadName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Social profiles (at least one required)
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [telegramOrDiscord, setTelegramOrDiscord] = useState('');

  // Logo file & preview
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Submission & UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field validation error markers
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Clean up object URL preview on unmount/change
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  if (!isOpen) return null;

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('The selected logo exceeds the 5MB file size limit.');
      return;
    }

    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, logo: '' }));

    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!communityName.trim()) {
      errors.communityName = 'Community Name is required';
    }

    if (!logoFile) {
      errors.logo = 'Community Logo is required';
    }

    if (!communityDescription.trim()) {
      errors.communityDescription = 'Community Description is required';
    } else if (communityDescription.trim().length < 10) {
      errors.communityDescription = 'Please provide at least 10 characters';
    }

    if (!leadName.trim()) {
      errors.leadName = 'Community Lead Name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email Address is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone / WhatsApp number is required';
    } else if (!isValidPhone(phone)) {
      errors.phone = 'Please include country code (e.g. +91 98765 43210)';
    }

    // At least one social profile or website link is required
    const hasSocial =
      websiteUrl.trim() ||
      xUrl.trim() ||
      instagramUrl.trim() ||
      linkedinUrl.trim() ||
      telegramOrDiscord.trim();

    if (!hasSocial) {
      errors.social = 'Please provide at least one social profile or community website';
    }

    // Validate optional URLs if provided
    if (websiteUrl.trim() && !isValidUrl(websiteUrl)) {
      errors.websiteUrl = 'Please enter a valid website URL';
    }
    if (xUrl.trim() && !isValidUrl(formatSocialUrl(xUrl, 'x'))) {
      errors.xUrl = 'Please enter a valid X profile URL or handle';
    }
    if (instagramUrl.trim() && !isValidUrl(formatSocialUrl(instagramUrl, 'instagram'))) {
      errors.instagramUrl = 'Please enter a valid Instagram URL or handle';
    }
    if (linkedinUrl.trim() && !isValidUrl(formatSocialUrl(linkedinUrl, 'linkedin'))) {
      errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }
    if (telegramOrDiscord.trim()) {
      const isTgOrDiscord =
        telegramOrDiscord.includes('t.me') ||
        telegramOrDiscord.includes('discord') ||
        telegramOrDiscord.startsWith('@') ||
        telegramOrDiscord.length > 2;
      if (!isTgOrDiscord) {
        errors.telegramOrDiscord = 'Please enter a valid Telegram or Discord link/handle';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitError(null);

    if (!validateForm()) {
      setSubmitError('Please correct the highlighted fields before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload logo to Supabase Storage bucket 'community-logos'
      let uploadedLogoUrl = '';
      if (logoFile) {
        const uploadRes = await uploadCommunityLogo(logoFile);
        if (!uploadRes.success || !uploadRes.url) {
          setSubmitError(uploadRes.error || 'Failed to upload community logo. Please try again.');
          setIsSubmitting(false);
          return;
        }
        uploadedLogoUrl = uploadRes.url;
      }

      // 2. Format social profile links
      const formattedWebsite = websiteUrl.trim() ? formatSocialUrl(websiteUrl, 'website') : '';
      const formattedX = xUrl.trim() ? formatSocialUrl(xUrl, 'x') : '';
      const formattedInstagram = instagramUrl.trim() ? formatSocialUrl(instagramUrl, 'instagram') : '';
      const formattedLinkedin = linkedinUrl.trim() ? formatSocialUrl(linkedinUrl, 'linkedin') : '';

      // Determine telegram vs discord
      let formattedTelegram = '';
      let formattedDiscord = '';
      let formattedWhatsapp = '';
      if (telegramOrDiscord.trim()) {
        const val = telegramOrDiscord.trim();
        if (val.includes('chat.whatsapp.com')) {
          formattedWhatsapp = /^https?:\/\//.test(val) ? val : `https://${val}`;
        } else if (val.includes('discord')) {
          formattedDiscord = formatSocialUrl(val, 'discord');
        } else if (val.includes('t.me') || val.startsWith('@')) {
          formattedTelegram = formatSocialUrl(val, 'telegram');
        } else {
          // Default to Telegram or general community channel
          formattedTelegram = formatSocialUrl(val, 'telegram');
        }
      }

      // 3. Submit application to Supabase database
      const res = await submitCommunityPartnerApplication({
        community_name: communityName,
        community_logo_url: uploadedLogoUrl,
        community_description: communityDescription,
        lead_name: leadName,
        email,
        phone,
        website_url: formattedWebsite,
        x_url: formattedX,
        instagram_url: formattedInstagram,
        linkedin_url: formattedLinkedin,
        telegram_url: formattedTelegram,
        discord_url: formattedDiscord,
        whatsapp_url: formattedWhatsapp,
      });

      if (!res.success) {
        setSubmitError(res.error || 'Failed to submit application. Please check your connection and retry.');
        setIsSubmitting(false);
        return;
      }

      // Successful submission!
      setIsSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred during submission.');
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setCommunityName('');
    setCommunityDescription('');
    setLeadName('');
    setEmail('');
    setPhone('');
    setWebsiteUrl('');
    setXUrl('');
    setInstagramUrl('');
    setLinkedinUrl('');
    setTelegramOrDiscord('');
    handleRemoveLogo();
    setFieldErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-modal-title"
    >
      {/* Clickable Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-2xl bg-[#0E1013] text-[#ECEEF1] border-2 border-[#000000] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ring-1 ring-white/10 z-10 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#14171D] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#98A0AB]">
                MUMBAI ONCHAIN // PARTNER APPLICATION
              </span>
            </div>
            <h2
              id="partner-modal-title"
              className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-tight"
            >
              BECOME A COMMUNITY PARTNER
            </h2>
            <p className="font-sans text-xs text-[#98A0AB] max-w-lg">
              Connect your community with builders, founders, and the wider Web3 ecosystem during Mumbai Onchain Week.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 border border-white/20 bg-black/40 hover:bg-white hover:text-black text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Success State */}
          {isSuccess ? (
            <div className="py-8 sm:py-12 px-4 text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-[#22C55E]/10 border-2 border-[#22C55E] text-[#22C55E] rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <div className="font-mono text-xs uppercase tracking-widest text-[#22C55E] font-bold">
                  // SUBMISSION CONFIRMED
                </div>
                <h3 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                  Application Submitted Successfully!
                </h3>
                <p className="font-sans text-sm text-[#98A0AB] leading-relaxed pt-1">
                  Thank you for your interest in becoming a Mumbai Onchain Community Partner. Your application has been received and is pending review.
                </p>
              </div>

              <div className="p-4 bg-[#14171D] border border-white/10 rounded-sm max-w-md mx-auto text-left font-mono text-xs space-y-2">
                <div className="text-[#98A0AB] text-[11px] uppercase tracking-wider">
                  WHAT HAPPENS NEXT?
                </div>
                <div className="text-white text-xs leading-relaxed">
                  Our core ecosystem team will review your application details. You will be contacted via email or WhatsApp regarding partnership onboarding and schedule coordination.
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-[#E0E0E0] px-8 py-3.5 border-2 border-black font-heading font-black text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] cursor-pointer"
                >
                  <span>RETURN TO WEBSITE</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Submission Error Banner */}
              {submitError && (
                <div className="p-3.5 bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-mono flex items-start gap-2.5 rounded-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span className="leading-relaxed">{submitError}</span>
                </div>
              )}

              {/* 1. Community Name & Description */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Community Name <span className="text-[#F97316]">*</span>
                    </span>
                    {fieldErrors.communityName && (
                      <span className="text-red-400 normal-case font-normal text-[11px]">
                        {fieldErrors.communityName}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={communityName}
                    onChange={(e) => {
                      setCommunityName(e.target.value);
                      if (fieldErrors.communityName) {
                        setFieldErrors((prev) => ({ ...prev, communityName: '' }));
                      }
                    }}
                    placeholder="e.g. Superteam India, Web3 Mumbai, Ethereum Pune"
                    className={`w-full p-3 bg-[#171A21] border-2 ${
                      fieldErrors.communityName ? 'border-red-500' : 'border-white/20 focus:border-[#F97316]'
                    } text-white font-mono text-xs focus:outline-none transition-colors placeholder:text-[#5F6772]`}
                  />
                </div>

                {/* 2. Community Logo Upload & Preview */}
                <div className="space-y-2">
                  <label className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Community Logo <span className="text-[#F97316]">*</span>
                    </span>
                    {fieldErrors.logo && (
                      <span className="text-red-400 normal-case font-normal text-[11px]">
                        {fieldErrors.logo}
                      </span>
                    )}
                  </label>

                  <div className="border-2 border-dashed border-white/20 bg-[#171A21] p-4 rounded-sm">
                    {logoPreview ? (
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative w-20 h-20 bg-black/60 border-2 border-white/20 rounded-sm overflow-hidden flex items-center justify-center p-1">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                          <div className="font-mono text-xs text-white font-bold truncate">
                            {logoFile?.name || 'Selected Logo'}
                          </div>
                          <div className="font-mono text-[11px] text-[#98A0AB]">
                            {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''} • Ready for upload
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold border border-white/20 transition-colors cursor-pointer"
                            >
                              CHANGE
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 text-red-300 font-mono text-[11px] font-bold border border-red-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>REMOVE</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-2">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#98A0AB]">
                          <Upload className="w-5 h-5 text-[#F97316]" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs text-white font-bold">
                            Click to upload your community logo
                          </p>
                          <p className="font-mono text-[11px] text-[#98A0AB]">
                            PNG, JPG, WebP, or SVG (Max 5MB)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 px-4 py-2 bg-white text-black hover:bg-[#E5E5E5] font-mono text-xs font-bold uppercase tracking-wider border border-black transition-colors cursor-pointer"
                        >
                          SELECT IMAGE FILE
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* 3. Community Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Community Description <span className="text-[#F97316]">*</span>
                    </label>
                    <span className="font-mono text-[10px] text-[#98A0AB]">
                      {communityDescription.length}/500
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={500}
                    value={communityDescription}
                    onChange={(e) => {
                      setCommunityDescription(e.target.value);
                      if (fieldErrors.communityDescription) {
                        setFieldErrors((prev) => ({ ...prev, communityDescription: '' }));
                      }
                    }}
                    placeholder="Briefly describe your community, members, focus areas (e.g. DeFi, AI, ZK), and activities..."
                    className={`w-full p-3 bg-[#171A21] border-2 ${
                      fieldErrors.communityDescription ? 'border-red-500' : 'border-white/20 focus:border-[#F97316]'
                    } text-white font-mono text-xs focus:outline-none transition-colors placeholder:text-[#5F6772] resize-none`}
                  />
                  {fieldErrors.communityDescription && (
                    <span className="text-red-400 font-mono text-[11px] block">
                      {fieldErrors.communityDescription}
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Leadership & Contact Details */}
              <div className="pt-2 border-t border-white/10 space-y-4">
                <div className="font-mono text-xs text-[#98A0AB] uppercase tracking-wider font-bold">
                  // LEAD CONTACT INFORMATION
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lead Name */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                      <span>
                        Community Lead Name <span className="text-[#F97316]">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => {
                        setLeadName(e.target.value);
                        if (fieldErrors.leadName) {
                          setFieldErrors((prev) => ({ ...prev, leadName: '' }));
                        }
                      }}
                      placeholder="e.g. Priya Deshmukh"
                      className={`w-full p-3 bg-[#171A21] border-2 ${
                        fieldErrors.leadName ? 'border-red-500' : 'border-white/20 focus:border-[#F97316]'
                      } text-white font-mono text-xs focus:outline-none transition-colors placeholder:text-[#5F6772]`}
                    />
                    {fieldErrors.leadName && (
                      <span className="text-red-400 font-mono text-[11px] block">
                        {fieldErrors.leadName}
                      </span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                      <span>
                        Email Address <span className="text-[#F97316]">*</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: '' }));
                        }
                      }}
                      placeholder="e.g. lead@community.org"
                      className={`w-full p-3 bg-[#171A21] border-2 ${
                        fieldErrors.email ? 'border-red-500' : 'border-white/20 focus:border-[#F97316]'
                      } text-white font-mono text-xs focus:outline-none transition-colors placeholder:text-[#5F6772]`}
                    />
                    {fieldErrors.email && (
                      <span className="text-red-400 font-mono text-[11px] block">
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone / WhatsApp Number */}
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Phone / WhatsApp Number <span className="text-[#F97316]">*</span>
                    </span>
                    <span className="text-[#98A0AB] font-normal normal-case text-[11px]">
                      Include country code
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="+91 98765 43210 or +1 415 555 2671"
                    className={`w-full p-3 bg-[#171A21] border-2 ${
                      fieldErrors.phone ? 'border-red-500' : 'border-white/20 focus:border-[#F97316]'
                    } text-white font-mono text-xs focus:outline-none transition-colors placeholder:text-[#5F6772]`}
                  />
                  {fieldErrors.phone && (
                    <span className="text-red-400 font-mono text-[11px] block">
                      {fieldErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* 5. Community Social Profiles */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-[#98A0AB] uppercase tracking-wider font-bold">
                    // COMMUNITY SOCIAL PROFILES <span className="text-[#F97316]">*</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#98A0AB]">
                    At least 1 link required
                  </span>
                </div>

                {fieldErrors.social && (
                  <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono">
                    {fieldErrors.social}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {/* Website */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#ECEEF1] uppercase block">
                      Community Website
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => {
                          setWebsiteUrl(e.target.value);
                          if (fieldErrors.social) setFieldErrors((prev) => ({ ...prev, social: '' }));
                        }}
                        placeholder="https://yourcommunity.xyz"
                        className="w-full p-2.5 bg-[#171A21] border border-white/20 focus:border-[#F97316] text-white focus:outline-none placeholder:text-[#5F6772]"
                      />
                    </div>
                  </div>

                  {/* X Profile */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#ECEEF1] uppercase block">
                      X Profile
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={xUrl}
                        onChange={(e) => {
                          setXUrl(e.target.value);
                          if (fieldErrors.social) setFieldErrors((prev) => ({ ...prev, social: '' }));
                        }}
                        placeholder="https://x.com/community or @handle"
                        className="w-full p-2.5 bg-[#171A21] border border-white/20 focus:border-[#F97316] text-white focus:outline-none placeholder:text-[#5F6772]"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#ECEEF1] uppercase block">
                      Instagram
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={instagramUrl}
                        onChange={(e) => {
                          setInstagramUrl(e.target.value);
                          if (fieldErrors.social) setFieldErrors((prev) => ({ ...prev, social: '' }));
                        }}
                        placeholder="https://instagram.com/handle"
                        className="w-full p-2.5 bg-[#171A21] border border-white/20 focus:border-[#F97316] text-white focus:outline-none placeholder:text-[#5F6772]"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#ECEEF1] uppercase block">
                      LinkedIn
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={linkedinUrl}
                        onChange={(e) => {
                          setLinkedinUrl(e.target.value);
                          if (fieldErrors.social) setFieldErrors((prev) => ({ ...prev, social: '' }));
                        }}
                        placeholder="https://linkedin.com/company/name"
                        className="w-full p-2.5 bg-[#171A21] border border-white/20 focus:border-[#F97316] text-white focus:outline-none placeholder:text-[#5F6772]"
                      />
                    </div>
                  </div>

                  {/* Telegram / Discord */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#ECEEF1] uppercase block">
                      Telegram / Discord / WhatsApp group
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={telegramOrDiscord}
                        onChange={(e) => {
                          setTelegramOrDiscord(e.target.value);
                          if (fieldErrors.social) setFieldErrors((prev) => ({ ...prev, social: '' }));
                        }}
                        placeholder="t.me/community, discord.gg/invite or chat.whatsapp.com/…"
                        className="w-full p-2.5 bg-[#171A21] border border-white/20 focus:border-[#F97316] text-white focus:outline-none placeholder:text-[#5F6772]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#98A0AB] text-[11px] font-mono">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                  <span>Private application details are secured & reviewed manually.</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-mono text-xs font-bold border border-white/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-black px-6 py-3 border-2 border-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-150 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>SUBMITTING...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-black" />
                        <span>SUBMIT APPLICATION</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
