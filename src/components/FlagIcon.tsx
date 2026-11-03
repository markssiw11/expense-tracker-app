import { FlagCountryCode } from "@/src/constants/Languages";
import React from "react";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  Polygon,
  Rect,
} from "react-native-svg";

interface FlagIconProps {
  /** ISO country code of the flag to render. */
  country: FlagCountryCode;
  /** Width in px. Height is derived from a 3:2 aspect ratio. */
  size?: number;
  /** Optional corner radius. Defaults to ~15% of height. */
  borderRadius?: number;
}

/**
 * Renders a country flag as a vector (SVG) instead of relying on the emoji
 * flag glyphs, which some iOS Simulator runtimes fail to render. Drawn at a
 * 3:2 aspect ratio to match standard flag proportions.
 */
export function FlagIcon({ country, size = 28, borderRadius }: FlagIconProps) {
  const width = size;
  const height = Math.round((size * 2) / 3);
  const radius = borderRadius ?? Math.round(height * 0.15);
  const clipId = `flag-clip-${country}`;

  return (
    <Svg width={width} height={height} viewBox="0 0 60 40">
      <Defs>
        <ClipPath id={clipId}>
          <Rect x="0" y="0" width="60" height="40" rx={radius} ry={radius} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>{renderFlag(country)}</G>
      {/* Subtle border so light flags (JP/KR) stay visible on white cards. */}
      <Rect
        x="0.5"
        y="0.5"
        width="59"
        height="39"
        rx={radius}
        ry={radius}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={1}
      />
    </Svg>
  );
}

function renderFlag(country: FlagCountryCode): React.ReactNode {
  switch (country) {
    case "US":
      return <UnitedStates />;
    case "VN":
      return <Vietnam />;
    case "JP":
      return <Japan />;
    case "KR":
      return <Korea />;
    case "ID":
      return <Indonesia />;
    case "IN":
      return <India />;
    case "TH":
      return <Thailand />;
    case "PH":
      return <Philippines />;
    default:
      return null;
  }
}

function UnitedStates() {
  const stripeHeight = 40 / 13;
  const stripes = Array.from({ length: 13 }, (_, i) => (
    <Rect
      key={i}
      x="0"
      y={i * stripeHeight}
      width="60"
      height={stripeHeight}
      fill={i % 2 === 0 ? "#B22234" : "#FFFFFF"}
    />
  ));
  return (
    <>
      <Rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      {stripes}
      {/* Canton */}
      <Rect x="0" y="0" width="26" height={stripeHeight * 7} fill="#3C3B6E" />
    </>
  );
}

function Vietnam() {
  // Centered five-pointed star, points outward, on a red field.
  const cx = 30;
  const cy = 20;
  const outer = 11;
  const inner = outer * 0.382;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    // Start at top point (-90deg) and step by 36deg.
    const angle = (Math.PI / 180) * (i * 36 - 90);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return (
    <>
      <Rect x="0" y="0" width="60" height="40" fill="#DA251D" />
      <Polygon points={points.join(" ")} fill="#FFFF00" />
    </>
  );
}

function Japan() {
  return (
    <>
      <Rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      <Circle cx="30" cy="20" r="12" fill="#BC002D" />
    </>
  );
}

function Korea() {
  // Simplified taegeuk (yin-yang) plus the four trigrams (bars).
  const cx = 30;
  const cy = 20;
  const r = 9;
  return (
    <>
      <Rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      {/* Taegeuk: red top half, blue bottom half via two half-discs. */}
      <Path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r / 2} ${
          r / 2
        } 0 0 1 ${cx} ${cy} A ${r / 2} ${r / 2} 0 0 0 ${cx - r} ${cy} Z`}
        fill="#CD2E3A"
      />
      <Path
        d={`M ${cx - r} ${cy} A ${r / 2} ${r / 2} 0 0 1 ${cx} ${cy} A ${
          r / 2
        } ${r / 2} 0 0 0 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`}
        fill="#0047A0"
      />
      {/* Four trigrams (solid bars, simplified). */}
      <G stroke="#000000" strokeWidth={1.4}>
        {/* Top-left */}
        <Path d="M 10 8 L 16 5" />
        <Path d="M 11 10 L 17 7" />
        <Path d="M 12 12 L 18 9" />
        {/* Bottom-right */}
        <Path d="M 44 31 L 50 28" />
        <Path d="M 45 33 L 51 30" />
        <Path d="M 46 35 L 52 32" />
        {/* Top-right */}
        <Path d="M 44 9 L 50 12" />
        <Path d="M 45 7 L 51 10" />
        <Path d="M 46 5 L 52 8" />
        {/* Bottom-left */}
        <Path d="M 10 32 L 16 35" />
        <Path d="M 11 30 L 17 33" />
        <Path d="M 12 28 L 18 31" />
      </G>
    </>
  );
}

function Indonesia() {
  return (
    <>
      <Rect x="0" y="0" width="60" height="20" fill="#CE1126" />
      <Rect x="0" y="20" width="60" height="20" fill="#FFFFFF" />
    </>
  );
}

function India() {
  const centerX = 30;
  const centerY = 20;
  const radius = 6;
  const spokes = Array.from({ length: 24 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 24;
    return (
      <Path
        key={index}
        d={`M ${centerX} ${centerY} L ${centerX + radius * Math.cos(angle)} ${centerY + radius * Math.sin(angle)}`}
        stroke="#000080"
        strokeWidth={0.45}
      />
    );
  });

  return (
    <>
      <Rect x="0" y="0" width="60" height="13.34" fill="#FF9933" />
      <Rect x="0" y="13.33" width="60" height="13.34" fill="#FFFFFF" />
      <Rect x="0" y="26.66" width="60" height="13.34" fill="#138808" />
      <Circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="#000080"
        strokeWidth={0.8}
      />
      {spokes}
    </>
  );
}

function Thailand() {
  return (
    <>
      <Rect x="0" y="0" width="60" height="6.67" fill="#A51931" />
      <Rect x="0" y="6.67" width="60" height="6.66" fill="#FFFFFF" />
      <Rect x="0" y="13.33" width="60" height="13.34" fill="#2D2A4A" />
      <Rect x="0" y="26.67" width="60" height="6.66" fill="#FFFFFF" />
      <Rect x="0" y="33.33" width="60" height="6.67" fill="#A51931" />
    </>
  );
}

function Philippines() {
  return (
    <>
      <Rect x="0" y="0" width="60" height="20" fill="#0038A8" />
      <Rect x="0" y="20" width="60" height="20" fill="#CE1126" />
      <Path d="M 0 0 L 27 20 L 0 40 Z" fill="#FFFFFF" />
      <Circle cx="8" cy="20" r="2.2" fill="#FCD116" />
      <Circle cx="2.8" cy="8.5" r="1" fill="#FCD116" />
      <Circle cx="2.8" cy="31.5" r="1" fill="#FCD116" />
      <Circle cx="22" cy="20" r="1" fill="#FCD116" />
    </>
  );
}

export default FlagIcon;
