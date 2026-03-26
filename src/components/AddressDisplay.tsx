import { useState, useCallback } from 'react';

interface AddressDisplayProps {
  address: string;
  nametag?: string | null;
  truncate?: boolean;
}

/** Truncate a DIRECT:// address to show first 12 + last 6 hex chars */
function truncateAddress(address: string): string {
  const prefix = 'DIRECT://';
  if (address.startsWith(prefix)) {
    const hex = address.slice(prefix.length);
    if (hex.length > 18) {
      return `${prefix}${hex.slice(0, 12)}...${hex.slice(-6)}`;
    }
  }
  // Fallback: generic truncation
  if (address.length > 24) {
    return `${address.slice(0, 18)}...${address.slice(-6)}`;
  }
  return address;
}

export function AddressDisplay({ address, nametag, truncate = true }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [address]);

  const displayAddress = truncate ? truncateAddress(address) : address;

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="min-w-0 flex-1">
        {nametag ? (
          <>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              @{nametag}
            </div>
            <div
              className="text-[11px] font-mono truncate"
              style={{ color: 'var(--text-muted)' }}
              title={address}
            >
              {displayAddress}
            </div>
          </>
        ) : (
          <div
            className="text-xs font-mono truncate"
            style={{ color: 'var(--text-secondary)' }}
            title={address}
          >
            {displayAddress}
          </div>
        )}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="shrink-0 p-1 rounded transition-colors cursor-pointer"
        style={{ color: copied ? 'var(--accent-text)' : 'var(--text-muted)' }}
        onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'var(--text-secondary)'; }}
        onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'var(--text-muted)'; }}
        title={copied ? 'Copied!' : 'Copy address'}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
