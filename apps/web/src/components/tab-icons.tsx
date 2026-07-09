/** Flat SVG tab icons — inherit currentColor so active/inactive TabBar colors work. */

const size = 20

function Icon ({ children, label }: { children: React.ReactNode, label: string }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <title>{label}</title>
      {children}
    </svg>
  )
}

/** Stylized football matching GoalTip mark (pentagon + seams). */
export function PartyIcon (): React.JSX.Element {
  return (
    <Icon label="Party">
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,8.2 14.8,10.2 13.7,13.4 10.3,13.4 9.2,10.2" fill="currentColor" stroke="none" />
      <path d="M12 8.2V3.5M14.8 10.2l4.2-1.4M13.7 13.4l2.6 4.2M10.3 13.4l-2.6 4.2M9.2 10.2L5 8.8" />
    </Icon>
  )
}

export function WalletIcon (): React.JSX.Element {
  return (
    <Icon label="Wallet">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.25" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function CoachIcon (): React.JSX.Element {
  return (
    <Icon label="Coach">
      {/* Simple brain outline — flat stroke, no emoji */}
      <path d="M9 5.5c-2 0-3.5 1.6-3.5 3.5 0 1 .4 1.9 1.1 2.5-.2.4-.3.9-.3 1.4 0 1.7 1.3 3.1 3 3.4V18h5.4v-1.7c1.7-.3 3-1.7 3-3.4 0-.5-.1-1-.3-1.4.7-.6 1.1-1.5 1.1-2.5 0-1.5-.9-2.8-2.2-3.3C15.8 4.6 14.5 4 13 4c-.8 0-1.5.2-2.1.5C10.3 4.2 9.7 4 9 4.2" />
      <path d="M12 8.5v6M9.5 10.5c.7.5 1.5.8 2.5.8s1.8-.3 2.5-.8" />
    </Icon>
  )
}

export function ActivityIcon (): React.JSX.Element {
  return (
    <Icon label="Activity">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Icon>
  )
}

export function SettingsIcon (): React.JSX.Element {
  return (
    <Icon label="Settings">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.4l1.6 1.6M17.5 16l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.6l1.6-1.6M17.5 8l1.6-1.6" />
    </Icon>
  )
}
