/*
 * Spec §10: thin, geometric, 1.5px stroke, rounded, consistent, a little
 * quirky. Drawn by hand rather than pulled from a set so the stroke weight
 * and corner radius match the rest of the wall exactly.
 */

import type { ReactElement } from 'react'

export type IconName =
  | 'check'
  | 'plus'
  | 'arrow'
  | 'basket'
  | 'pin'
  | 'frame'
  | 'people'
  | 'close'
  | 'trash'
  | 'clock'
  | 'sun'
  | 'edit'
  | 'link'

const PATHS: Record<IconName, ReactElement> = {
  check: <polyline points="5 12.5 9.5 17 19 7" />,
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  arrow: (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  basket: (
    <>
      <path d="M3.5 8.5h17l-1.6 10a1.6 1.6 0 0 1-1.6 1.4H6.7a1.6 1.6 0 0 1-1.6-1.4Z" />
      <path d="M8.5 8.5 12 3l3.5 5.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21v-7" />
      <path d="M8 4h8l-1 6 3 2.5v1.5H6V12.5L9 10Z" />
    </>
  ),
  frame: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17 4.2-4.2a2 2 0 0 1 2.7 0L16 17" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8" />
      <path d="M17.5 14.8A5.5 5.5 0 0 1 20.5 20" />
    </>
  ),
  close: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-11.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <polyline points="12 7 12 12 15.5 14" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  edit: (
    <>
      <path d="M14.7 4.8 19.2 9.3 9 19.5H4.5V15Z" />
      <path d="M12.7 6.8 17.2 11.3" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 7.3 12.8 5.5a3.3 3.3 0 0 1 4.7 4.7L15.7 12" />
      <path d="M13 16.7 11.2 18.5a3.3 3.3 0 0 1-4.7-4.7L8.3 12" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 22, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
