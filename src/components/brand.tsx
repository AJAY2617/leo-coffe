import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Leo Coffe home">
      <Image className="brand-logo" src="/brand/leo-icon-light.png" alt="" width={48} height={48} unoptimized />
      <span className="brand-label">Leo Coffe<span className="brand-dot">.</span></span>
    </Link>
  );
}
