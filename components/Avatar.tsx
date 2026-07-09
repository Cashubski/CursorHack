"use client";

import { useState } from "react";
import type { Member } from "@/lib/collab";

/** Renders a member's avatar image, falling back to a colored initial. */
export default function Avatar({
  member,
  size = 24,
  ring = "ring-white"
}: {
  member: Member;
  size?: number;
  ring?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (member.name || member.handle)
    .replace(/^@/, "")
    .charAt(0)
    .toUpperCase();

  if (member.avatar && !failed) {
    // Plain <img> to avoid next/image remote-domain config.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={member.avatar}
        alt={member.name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`rounded-full object-cover ring-2 ${ring}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full font-semibold text-white ring-2 ${ring}`}
      style={{
        width: size,
        height: size,
        backgroundColor: member.color,
        fontSize: size * 0.42
      }}
      title={member.name}
    >
      {initial}
    </span>
  );
}
