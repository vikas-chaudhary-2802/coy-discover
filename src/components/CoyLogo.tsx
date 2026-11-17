/* eslint-disable @next/next/no-img-element -- tiny static SVG, no optimisation needed */
export default function CoyLogo({ height = 26 }: { height?: number }) {
  return (
    <img
      src="/coy-wordmark.svg"
      alt="Coy"
      height={height}
      width={Math.round((height * 2013.3) / 729.5)}
      draggable={false}
    />
  );
}
