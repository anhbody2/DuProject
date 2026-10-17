import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps } from 'framer-motion';
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, Circle, LoaderCircle } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/validation';
import { BandBody, BandShadow, CtaButton, EmptyBox, FieldError, FieldLabel, FillImg, ImgEmpty, PhotoBox, RuleList, SpinnerBox } from './styles';

export * from './styles';

/* ================================================================ brand surfaces */

/** Red textured section with an angled edge and a brown drop shadow. */
export function RedBand({ clip, pad, both, margin, children }: { clip: string; pad: string; both?: boolean; margin?: string; children: ReactNode }) {
  return (
    <BandShadow $both={both} $margin={margin}>
      <BandBody $clip={clip} $pad={pad}>{children}</BandBody>
    </BandShadow>
  );
}

/* ================================================================ buttons */

export function Cta({ onClick, rotate = -1.5, children, style, disabled, type = 'button' }: {
  onClick?: () => void; rotate?: number; children: ReactNode; style?: CSSProperties; disabled?: boolean; type?: 'button' | 'submit';
}) {
  return <CtaButton type={type} onClick={onClick} disabled={disabled} $rotate={rotate} style={style}>{children}</CtaButton>;
}

/* ================================================================ motion */

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

/* ================================================================ media */

/** Red lunch-tray mat from the design assets, used as scattered decoration. */
export function Tray({ style, rotate = 0, speed = 0.18 }: { style?: CSSProperties; rotate?: number; speed?: number }) {
  return (
    <Parallax speed={speed} spin={speed * 40} style={{ aspectRatio: '1/1', pointerEvents: 'none', ...style }}>
      <FillImg src="/assets/tray.png" alt="" loading="lazy" style={{ transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(0 20px 20px rgba(75,28,20,.3))' }} />
    </Parallax>
  );
}

/** Product/store photo, or the striped placeholder when the API has none or it fails to load. */
export function Photo({ src, alt, radius }: { src: string | null | undefined; alt: string; radius?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const ok = src && failed !== src;
  return (
    <PhotoBox $radius={radius}>
      {ok ? <FillImg src={src} alt={alt} $fit="cover" loading="lazy" onError={() => setFailed(src)} /> : <ImgEmpty><span>{alt}</span></ImgEmpty>}
    </PhotoBox>
  );
}

/* ================================================================ states */

export function Spinner({ label = 'Đang tải…', color = 'var(--muted)' }: { label?: string; color?: string }) {
  return (
    <SpinnerBox $color={color} role="status">
      <LoaderCircle size={20} className="spin" /> {label}
    </SpinnerBox>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <EmptyBox>
      <b>{title}</b>
      {hint && <span>{hint}</span>}
      {action}
    </EmptyBox>
  );
}

/* ================================================================ forms */

/** Labelled form field with its (live) validation error underneath. */
export function FormField({ title, error, wide, children }: { title: string; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <FieldLabel $wide={wide}>
      {title}
      {children}
      {error && <FieldError role="alert">{error}</FieldError>}
    </FieldLabel>
  );
}

/** Ticks off each password rule as the user types. */
export function PasswordRules({ value, wide }: { value: string; wide?: boolean }) {
  return (
    <RuleList aria-live="polite" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return <li key={r.label} data-ok={ok}>{ok ? <Check size={14} /> : <Circle size={10} />}{r.label}</li>;
      })}
    </RuleList>
  );
}

/* ================================================================ icons */

// Lucide v1 dropped brand icons.
export const FacebookIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
export const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);
