'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps } from 'framer-motion';
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { sx } from '@/lib/sx';

export const GRID3 = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,max(220px,calc((100% - 48px)/3))),1fr))';
export const strokeHead = 'color:var(--gold);-webkit-text-stroke:2px var(--brown);paint-order:stroke fill;text-shadow:0 3px 0 var(--brown)';

const EASE = [0.2, 0.8, 0.2, 1] as const;

const VARIANTS = {
  head: { hidden: { opacity: 0, y: 44, scale: 0.94 }, shown: { opacity: 1, y: 0, scale: 1 } },
  card: { hidden: { opacity: 0, y: 64, rotate: -2.5 }, shown: { opacity: 1, y: 0, rotate: 0 } },
  pop: { hidden: { opacity: 0, scale: 0.78, rotate: -8 }, shown: { opacity: 1, scale: 1, rotate: 0 } },
  block: { hidden: { opacity: 0, y: 70 }, shown: { opacity: 1, y: 0 } },
};

type RevealProps = HTMLMotionProps<'div'> & { kind?: keyof typeof VARIANTS; delay?: number };

/** Fades/slides its content in the first time it scrolls into view. */
export function Reveal({ kind = 'card', delay = 0, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <motion.div {...rest} />;
  return (
    <motion.div
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={VARIANTS[kind]}
      transition={{ duration: 0.75, delay, ease: EASE }}
      {...rest}
    />
  );
}

/** Moves (and optionally spins) with scroll, relative to its own position. */
export function Parallax({ speed, spin = 0, style, children }: { speed: number; spin?: number; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-300 * speed, 300 * speed]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-spin, spin]);
  return (
    <motion.div ref={ref} style={{ ...style, ...(reduce ? {} : { y, rotate }) }}>
      {children}
    </motion.div>
  );
}

/** Red lunch-tray mat from the design assets, used as scattered decoration. */
export function Tray({ style, rotate = 0, speed = 0.18 }: { style?: CSSProperties; rotate?: number; speed?: number }) {
  return (
    <Parallax speed={speed} spin={speed * 40} style={{ aspectRatio: '1/1', pointerEvents: 'none', ...style }}>
      <Image src="/assets/tray.png" alt="" fill sizes="300px" style={{ objectFit: 'contain', transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(0 20px 20px rgba(75,28,20,.3))' }} />
    </Parallax>
  );
}

export function Cta({ onClick, rotate = -1.5, children, style, disabled, type = 'button' }: {
  onClick?: () => void; rotate?: number; children: ReactNode; style?: CSSProperties; disabled?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="hv-cta"
      style={{
        ...sx('all:unset;cursor:pointer;text-align:center;background:var(--green);color:var(--gold);font-weight:900;font-size:clamp(20px,2.4vw,30px);padding:10px 28px;outline:2px dashed var(--cream);outline-offset:-7px;box-shadow:0 0 0 4px var(--green),0 7px 0 4px var(--green-dark)'),
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Product/store photo, or the striped placeholder when the API has none or it fails to load.
 * Remote URLs are entered by store owners, so the browser loads them directly
 * (`unoptimized`) instead of having the Next server fetch arbitrary hosts.
 */
export function Photo({ src, alt, sizes = '300px', radius }: { src: string | null | undefined; alt: string; sizes?: string; radius?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const ok = src && failed !== src;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: radius }}>
      {ok ? (
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized={/^https?:/.test(src)} onError={() => setFailed(src)} style={{ objectFit: 'cover' }} />
      ) : (
        <div className="img-empty"><span>{alt}</span></div>
      )}
    </div>
  );
}

export function Spinner({ label = 'Đang tải…', color = 'var(--muted)' }: { label?: string; color?: string }) {
  return (
    <div style={{ ...sx('display:flex;align-items:center;justify-content:center;gap:10px;padding:32px 0;font-size:14px;font-weight:700'), color }}>
      <LoaderCircle size={20} className="spin" /> {label}
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div style={sx('padding:40px 16px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center')}>
      <span style={sx('font-weight:900;font-size:22px;color:var(--red)')}>{title}</span>
      {hint && <span style={sx('font-size:14px;color:var(--muted);max-width:420px;line-height:1.45')}>{hint}</span>}
      {action}
    </div>
  );
}

// Lucide v1 dropped brand icons.
export const FacebookIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
export const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);
