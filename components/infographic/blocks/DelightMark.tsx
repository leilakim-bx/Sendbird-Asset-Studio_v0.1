import type { CSSProperties } from "react";
import { brand } from "@/lib/tokens/brand";

type Props = {
  size: number;
  style?: CSSProperties;
};

export function DelightMark({ size, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{ display: "block", width: size, height: size, ...style }}
    >
      <rect width="32" height="32" rx="16" fill={brand.color.infographic.orbitBlack} />
      <path
        d="M17.2861 14.6869H23.5V16.8328H18.8089L22.4552 20.4791L20.9343 22L17.2861 18.3518V23.5H15.1403V18.3777L11.5177 22.0002L9.99687 20.4794L9.99745 20.4788L9.99687 20.4782L13.6423 16.8328H8.5V14.6869H13.6213L9.99687 11.0625L11.5177 9.54163L15.1403 13.1642V8.5H17.2861V14.6869Z"
        fill={brand.color.white}
      />
      <path
        d="M20.8144 9.7085C21.6198 9.70851 22.2728 10.3614 22.2728 11.1668C22.2728 11.9723 21.6198 12.6252 20.8144 12.6252C20.009 12.6252 19.3561 11.9723 19.3561 11.1668C19.3561 10.3614 20.009 9.7085 20.8144 9.7085Z"
        fill={brand.color.white}
      />
    </svg>
  );
}
