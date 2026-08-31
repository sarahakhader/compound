"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const close = () => setMenuOpen(false)

  // On the home page use in-page anchors; from other pages prefix with /
  const contact = pathname === "/" ? "#contact" : "/#contact"

  return (
    <>
      <nav>
        <Link href="/" className="nav-brand" onClick={close}>C O M P O U N D</Link>
        <button className="nav-btn" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? "CLOSE" : "MENU"}
        </button>
      </nav>

      <div id="menu" className={menuOpen ? "open" : ""}>
        <p className="m-tag">Navigation</p>
        <ul className="m-links">
          <li><Link href="/studio" onClick={close}>Studio</Link></li>
          <li><Link href="/services" onClick={close}>Services</Link></li>
          <li><Link href="/work" onClick={close}>Work</Link></li>
          <li><Link href="/objects" onClick={close}>Objects</Link></li>
          <li><Link href="/universe" onClick={close}>Universe</Link></li>
          <li><a href={contact} onClick={close}>Contact</a></li>
        </ul>
        <div className="m-foot">
          <p>Taste, redefined</p>
          <p>© COMPOUND 2026</p>
        </div>
      </div>
    </>
  )
}
