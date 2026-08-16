/*
 * Stand-in artwork until there are real photographs.
 *
 * Spec §14 wants memories to feel editorial: large, strongly cropped, few
 * controls. So these are flat geometric compositions rather than grey boxes:
 * a horizon, a figure, a group. No gradients (§28), just the classifying tone
 * against paper and ink.
 *
 * Swap this component for an <img> when real photos land.
 */

import type { AccentKey } from '../lib/types'

const PATTERNS = 4

interface MomentArtProps {
  tone: AccentKey
  pattern: number
}

export function MomentArt({ tone, pattern }: MomentArtProps) {
  const p = ((pattern % PATTERNS) + PATTERNS) % PATTERNS

  return (
    <svg
      className="art"
      /* Portrait 4:5, the crop the phone actually shows, so nothing
         important gets sliced off at either breakpoint. */
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Placeholder artwork standing in for a family photograph"
    >
      <rect width="400" height="500" fill={`var(--${tone})`} />

      {p === 0 && (
        /* Sun over a low horizon, the sprinkler in the garden. Drifts and
           breathes very slowly, just enough to read as a living scene
           rather than a print (§15: calm, never "constant movement"). */
        <>
          <circle className="art__sun" cx="288" cy="152" r="74" fill="var(--paper)" opacity="0.7" />
          <path d="M0 368h400v132H0z" fill="var(--ink)" opacity="0.86" />
          <path
            className="art__horizon"
            d="M0 368c62-40 108-40 150-14s96 30 154-8 96-26 96-26"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.5"
            opacity="0.45"
          />
        </>
      )}

      {p === 1 && (
        /* Two arcs and a small figure, park day. */
        <>
          <path d="M-40 500a190 190 0 0 1 380 0z" fill="var(--paper)" opacity="0.55" />
          <path d="M140 500a210 210 0 0 1 420 0z" fill="var(--ink)" opacity="0.8" />
          <circle className="art__figure" cx="118" cy="148" r="38" fill="var(--ink)" opacity="0.86" />
        </>
      )}

      {p === 2 && (
        /* Four standing forms, everyone in one frame. A hair of independent
           sway per figure, like people actually standing rather than cut-outs. */
        <>
          <rect className="art__form art__form--1" x="40" y="212" width="58" height="288" rx="29" fill="var(--ink)" opacity="0.86" />
          <rect className="art__form art__form--2" x="120" y="158" width="58" height="342" rx="29" fill="var(--ink)" opacity="0.66" />
          <rect className="art__form art__form--3" x="200" y="250" width="58" height="250" rx="29" fill="var(--ink)" opacity="0.86" />
          <rect className="art__form art__form--4" x="280" y="190" width="58" height="310" rx="29" fill="var(--paper)" opacity="0.75" />
        </>
      )}

      {p === 3 && (
        /* An open doorway, coming home. */
        <>
          <path d="M100 500V230a100 100 0 0 1 200 0v270z" fill="var(--paper)" opacity="0.68" />
          <path className="art__sun" d="M156 500V266a44 44 0 0 1 88 0v234z" fill="var(--ink)" opacity="0.86" />
        </>
      )}
    </svg>
  )
}

export function randomPattern(): number {
  return Math.floor(Math.random() * PATTERNS)
}
