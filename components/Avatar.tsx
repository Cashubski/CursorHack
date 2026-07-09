import type { Member } from "@/lib/collab";

/** Renders a member's GitHub avatar, or a colored initial fallback. */
export default function Avatar({
  member,
  size = 24,
  ring = "ring-white"
}: {
  member: Member;
  size?: number;
  ring?: string;
}) {
  const initial = (member.signedIn ? member.handle : member.name)
    .replace(/^@/, "")
    .charAt(0)
    .toUpperCase();

  if (member.avatar) {
    // Plain <img> to avoid next/image remote-domain config.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={member.avatar}
        alt={member.name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
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
