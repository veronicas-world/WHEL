import Link from"next/link";

export default function Footer() {
 return (
 <footer style={{ backgroundColor:"#2E3B2E", color:"#fff" }}>
 <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

 {/* Brand */}
 <div className="sm:col-span-1">
 <p className="font-serif text-base font-bold mb-1" style={{ color:"#fff" }}>
 Women&apos;s Health Evidence Lab
 </p>
 <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>WHEL</p>
 </div>

 {/* Explore */}
 <div>
 <p className="section-label mb-4" style={{ color:"rgba(255,255,255,0.4)" }}>
 Explore
 </p>
 <div className="space-y-3">
 {[
 { label:"Browse Conditions", href:"/conditions" },
 { label:"Search", href:"/search" },
 { label:"Signal Types", href:"/signal-types" },
 ].map(({ label, href }) => (
 <Link
 key={href}
 href={href}
 className="block text-sm transition-opacity hover:opacity-70"
 style={{ color:"rgba(255,255,255,0.75)" }}
 >
 {label}
 </Link>
 ))}
 </div>
 </div>

 {/* About */}
 <div>
 <p className="section-label mb-4" style={{ color:"rgba(255,255,255,0.4)" }}>
 About
 </p>
 <div className="space-y-3">
 {[
 { label:"Mission", href:"/about" },
 { label:"Technical Architecture", href:"/about/technical-architecture" },
 { label:"Contact", href:"/about/contact" },
 ].map(({ label, href }) => (
 <Link
 key={href}
 href={href}
 className="block text-sm transition-opacity hover:opacity-70"
 style={{ color:"rgba(255,255,255,0.75)" }}
 >
 {label}
 </Link>
 ))}
 </div>
 </div>

 </div>

 {/* Bottom row */}
 <div
 className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
 style={{ borderTop:"1px solid rgba(255,255,255,0.1)" }}
 >
 <p className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>
 &copy; 2026 WHEL
 </p>
 <p className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>
 Database last updated: May 2026
 </p>
 <p className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>
 For research and educational purposes only.
 </p>
 </div>
 </div>
 </footer>
 );
}
