import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  Zap,
  Radio
} from 'lucide-react';

interface OnchainIntroVideoProps {
  videoSrc?: string;
  title?: string;
}

export const OnchainIntroVideo: React.FC<OnchainIntroVideoProps> = ({
  videoSrc = '/videos/onchain-intro.mp4',
  title = 'MUMBAI ONCHAIN // OFFICIAL INTRO STREAM'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Synchronize playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Handle Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleStartPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handleStartPlay();
    }
  };

  const handleSetSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      videoRef.current.muted = nextMuted;
      if (!nextMuted && volume === 0) {
        setVolume(0.8);
        videoRef.current.volume = 0.8;
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section className="w-full select-none" aria-label="Onchain Intro Video Player">
      <div
        ref={containerRef}
        className="w-full bg-[#050505] border-2 border-[#000000] text-[#FFFFFF] shadow-lg overflow-hidden flex flex-col group relative"
      >
        {/* Top Telemetry / Status Header */}
        <div className="bg-[#111111] border-b border-[#262626] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#0052FF] text-white text-[10px] font-bold uppercase tracking-wider">
              <Film className="w-3 h-3" />
              ONCHAIN INTRO
            </span>
            <span className="font-heading font-black text-sm text-[#F5F5F5] uppercase tracking-wide truncate">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
              <span className="font-bold tracking-wider uppercase text-white">
                {isPlaying ? 'PLAYING' : currentTime === 0 ? 'READY' : 'PAUSED'}
              </span>
            </div>
            <span className="hidden sm:inline text-[#525252]">|</span>
            <div className="hidden sm:flex items-center gap-1 text-[#D4D4D4]">
              <Radio className="w-3 h-3 text-[#0052FF]" />
              <span>SPEED: <strong className="text-white">{playbackRate}x</strong></span>
            </div>
            <span className="hidden md:inline text-[#525252]">|</span>
            <div className="hidden md:block text-[#888888]">
              DEVCON 8 MUMBAI
            </div>
          </div>
        </div>

        {/* Video Screen Area */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onClick={handleTogglePlayPause}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Big Center Play Overlay Button when paused */}
          {!isPlaying && (
            <button
              onClick={handleStartPlay}
              className="absolute inset-0 m-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0052FF]/90 hover:bg-[#0045D8] border-2 border-white text-white flex items-center justify-center transition-all transform hover:scale-105 shadow-2xl z-10"
              aria-label="Start Video"
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
            </button>
          )}

          {/* Scrubber progress preview bar across video bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#262626]">
            <div
              className="h-full bg-[#0052FF] transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Custom Controller Bar (Start, Stop, Pause, 1x, 2x, Volume, Timeline) */}
        <div className="bg-[#0D0D0D] border-t border-[#262626] p-3 sm:p-4 space-y-3">
          {/* Timeline / Scrubber Row */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#A3A3A3] w-12 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-[#262626] accent-[#0052FF] rounded cursor-pointer appearance-none"
                style={{
                  background: `linear-gradient(to right, #0052FF ${progressPercent}%, #262626 ${progressPercent}%)`
                }}
              />
            </div>
            <span className="font-mono text-xs text-[#737373] w-12 shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Primary Transport Controls: START, PAUSE, STOP */}
            <div className="flex items-center gap-2">
              {/* START / PLAY */}
              <button
                type="button"
                onClick={handleStartPlay}
                disabled={isPlaying}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold transition-all border ${
                  isPlaying
                    ? 'bg-[#1A1A1A] text-[#555555] border-[#2A2A2A] cursor-not-allowed'
                    : 'bg-[#0052FF] hover:bg-[#0045D8] text-white border-[#0052FF] active:scale-95 shadow-sm'
                }`}
                title="Start Playback"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START</span>
              </button>

              {/* PAUSE */}
              <button
                type="button"
                onClick={handlePause}
                disabled={!isPlaying}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold transition-all border ${
                  !isPlaying
                    ? 'bg-[#1A1A1A] text-[#555555] border-[#2A2A2A] cursor-not-allowed'
                    : 'bg-[#262626] hover:bg-[#333333] text-white border-[#404040] active:scale-95'
                }`}
                title="Pause Playback"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </button>

              {/* STOP */}
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold bg-[#171717] hover:bg-[#EF4444] text-[#E5E5E5] hover:text-white border border-[#333333] hover:border-[#EF4444] transition-all active:scale-95"
                title="Stop and Reset to 0:00"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP</span>
              </button>

              {/* REWIND / RESET */}
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="hidden sm:flex items-center gap-1 px-2 py-1.5 font-mono text-xs text-[#A3A3A3] hover:text-white border border-transparent hover:border-[#333333] transition-all"
                title="Rewind to Start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed Settings: Dedicated 1X, 2X, plus other presets */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#888888] font-bold uppercase tracking-wider hidden sm:inline">
                SPEED:
              </span>

              <div className="inline-flex rounded border border-[#333333] bg-[#141414] p-0.5">
                {/* 0.5x */}
                <button
                  type="button"
                  onClick={() => handleSetSpeed(0.5)}
                  className={`px-2 py-1 font-mono text-xs font-bold transition-all ${
                    playbackRate === 0.5
                      ? 'bg-[#0052FF] text-white shadow-sm'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  0.5x
                </button>

                {/* 1X (Requested) */}
                <button
                  type="button"
                  onClick={() => handleSetSpeed(1)}
                  className={`px-3 py-1 font-mono text-xs font-bold transition-all ${
                    playbackRate === 1
                      ? 'bg-[#0052FF] text-white shadow-sm ring-1 ring-white/20'
                      : 'text-[#D4D4D4] hover:text-white'
                  }`}
                  title="Normal Speed (1x)"
                >
                  1x
                </button>

                {/* 1.5x */}
                <button
                  type="button"
                  onClick={() => handleSetSpeed(1.5)}
                  className={`px-2 py-1 font-mono text-xs font-bold transition-all hidden sm:inline-block ${
                    playbackRate === 1.5
                      ? 'bg-[#0052FF] text-white shadow-sm'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  1.5x
                </button>

                {/* 2X (Requested) */}
                <button
                  type="button"
                  onClick={() => handleSetSpeed(2)}
                  className={`px-3 py-1 font-mono text-xs font-bold transition-all ${
                    playbackRate === 2
                      ? 'bg-[#0052FF] text-white shadow-sm ring-1 ring-white/20'
                      : 'text-[#D4D4D4] hover:text-white'
                  }`}
                  title="Double Speed (2x)"
                >
                  2x
                </button>
              </div>
            </div>

            {/* Audio & Fullscreen Controls */}
            <div className="flex items-center gap-3">
              {/* Volume Slider & Mute Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="text-[#A3A3A3] hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-[#EF4444]" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1.5 bg-[#333333] accent-[#0052FF] cursor-pointer"
                  title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-1.5 text-[#A3A3A3] hover:text-white hover:bg-[#222222] border border-transparent hover:border-[#333333] transition-all"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Sub-bar with Onchain telemetry details */}
        <div className="bg-[#050505] px-4 py-2 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#737373]">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-[#EAB308]" />
            <span>MUMBAI ONCHAIN MEDIA NODE // 1080P PRORES STREAM</span>
          </div>
          <div className="flex items-center gap-3">
            <span>RES: 1920x1080</span>
            <span>CODEC: H.264 / AAC</span>
            <span className="text-[#0052FF] font-bold">ETHEREUM DEVCON 8</span>
          </div>
        </div>
      </div>
    </section>
  );
};
