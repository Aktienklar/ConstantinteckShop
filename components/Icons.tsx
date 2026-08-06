/**
 * Line icons for navigation, categories and the trust row.
 *
 * These replace the emoji the prototype used: emoji render differently on
 * every platform, cannot take the brand colour and read as improvised on a
 * page that asks for a payment.
 */

type IconProps = {
  className?: string;
  /** Set when the icon carries meaning on its own; otherwise it stays decorative. */
  title?: string;
};

function Svg({
  className = "h-6 w-6",
  title,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {children}
    </svg>
  );
}

/**
 * Baking & sweets. The wrapper pleats run at an angle with the taper –
 * drawn vertically the shape reads as a waste bin instead of a cupcake.
 */
export function CupcakeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.7 11.6h10.6l-1.2 7.7a2 2 0 0 1-2 1.7h-4.2a2 2 0 0 1-2-1.7L6.7 11.6Z" />
      <path d="M6.8 11.6c-.8-1.5 0-3.4 1.7-3.8.2-2 1.8-3.4 3.5-3.4s3.3 1.4 3.5 3.4c1.7.4 2.5 2.3 1.7 3.8" />
      <path d="m10.3 11.6-.5 9.4M13.7 11.6l.5 9.4" />
    </Svg>
  );
}

/**
 * Savoury & everyday. Two handles, otherwise a single-handled pot with a rim
 * reads as a teacup at small sizes.
 */
export function PotIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.6 10.4h12.8v3.6a5.4 5.4 0 0 1-5.4 5.4H9a5.4 5.4 0 0 1-5.4-5.4v-3.6Z" />
      <path d="M2.6 10.4h14.8" />
      <path d="M3.4 11.6H2.2a1.6 1.6 0 0 0 0 3.2h1.2" />
      <path d="M16.6 11.6h1.2a1.6 1.6 0 0 1 0 3.2h-1.2" />
      <path d="M8 7.6c0-1.1 1.1-1.4 1.1-2.5M12 7.6c0-1.1 1.1-1.4 1.1-2.5" />
    </Svg>
  );
}

/** Shop / cart */
export function BagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 2.8 3.4 6.4V19a2 2 0 0 0 2 2h13.2a2 2 0 0 0 2-2V6.4L18 2.8Z" />
      <path d="M3.4 6.4h17.2" />
      <path d="M16 10.2a4 4 0 0 1-8 0" />
    </Svg>
  );
}

/** Shipping */
export function TruckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.6 6h10v10.4h-10z" />
      <path d="M12.6 9.6h3.9l3.1 3.1v3.7h-7z" />
      <circle cx="6.4" cy="18" r="1.9" />
      <circle cx="16.6" cy="18" r="1.9" />
    </Svg>
  );
}

/** Returns / money back */
export function ReturnIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12a8 8 0 1 1-2.7-6" />
      <path d="M20.2 3.8v4.6h-4.6" />
    </Svg>
  );
}

/** Secure payment */
export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.9 4.6 6.1v5.8c0 4.3 3 7.5 7.4 9.2 4.4-1.7 7.4-4.9 7.4-9.2V6.1L12 2.9Z" />
      <path d="m9 12.1 2.2 2.2 4.2-4.4" />
    </Svg>
  );
}

/** Instant download */
export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2v11.2" />
      <path d="m7.6 10.2 4.4 4.4 4.4-4.4" />
      <path d="M4.6 19.6h14.8" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.6 4.6 4.5L19 7" />
    </Svg>
  );
}
