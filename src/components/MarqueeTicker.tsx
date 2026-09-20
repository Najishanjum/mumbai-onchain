import React from 'react';

interface MarqueeTickerProps {
  items?: string[];
  reverse?: boolean;
}

const DEFAULT_ITEMS = [
  'MUMBAI // ONCHAIN WEEK',
  'DEVCON 8 INDIA',
  'ETHGLOBAL MUMBAI',
  'INDIA BLOCKCHAIN WEEK',
  'ETHEREUM',
  'BUILDERS & PROTOCOLS',
  'WEB3 ONCHAIN',
  'NOV 01—08 2026',
  '19.0760° N, 72.8777° E',
  'JIO WORLD CENTRE • BKC',
  'PERSONAL COMMAND CENTER',
  'COMMUNITY RUN // NAJISH ANJUM',
];

export const MarqueeTicker: React.FC<MarqueeTickerProps> = ({
  items = DEFAULT_ITEMS,
  reverse = false,
}) => {
  return (
    <div
      className="w-full bg-[#000000] text-[#FFFFFF] border-y border-[#000000] py-2 overflow-hidden select-none relative z-30 cursor-default"
      title="Mumbai Onchain Week Telemetry Stream (Hover to pause)"
    >
      <div className={reverse ? 'animate-ticker-reverse' : 'animate-ticker'}>
        {/* Render twice for seamless infinite looping */}
        {[...Array(2)].map((_, arrayIdx) => (
          <div key={arrayIdx} className="flex items-center shrink-0 space-x-6 pr-6">
            {items.map((item, idx) => (
              <React.Fragment key={`${arrayIdx}-${idx}`}>
                <span className="font-mono text-xs sm:text-[13px] tracking-wider font-semibold whitespace-nowrap text-[#FFFFFF]">
                  {item}
                </span>
                <span className="text-[#F97316] text-[10px] sm:text-xs select-none">
                  ◆
                </span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
