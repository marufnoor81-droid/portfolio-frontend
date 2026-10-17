import { useState } from "react";
import { ArrowDown, ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../api/hooks";

export function SiteLayout() {
    const { isOwner, logout, loading } = useAuth();
    const profile = useProfile();
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <>
            <a className="skip-link" href="#main">Skip to content</a>
            <header className="site-header">
                <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
                    <span className="brand-mark">d.</span>
                    <span>{profile.data?.full_name || "Portfolio"}<small>{profile.data?.headline || "developer & maker"}</small></span>
                </Link>
                <button
                    className="icon-button menu-toggle"
                    type="button"
                    aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
                    <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
                    <NavLink to="/projects" onClick={() => setMenuOpen(false)}>Projects</NavLink>
                    <NavLink to="/blog" onClick={() => setMenuOpen(false)}>Journal</NavLink>
                    <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
                    {!loading && isOwner && <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>}
                    {!loading && isOwner && (
                        <button className="nav-logout" type="button" onClick={() => void logout()}>Sign out</button>
                    )}
                    <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
                        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
                    </button>
                    <Link className="button button-small" to="/contact" onClick={() => setMenuOpen(false)}>
                        Start a conversation <ArrowUpRight size={15} />
                    </Link>
                </nav>
            </header>
            {location.pathname === "/login" ? null : <div className="header-rule" />}
            <main id="main"><Outlet /></main>
            <footer className="site-footer">
                <Link className="brand footer-brand" to="/">
                    <span className="brand-mark">d.</span>
                    <span>Portfolio<small>Built around real work.</small></span>
                </Link>
                <p>Ideas made useful. <span>© {new Date().getFullYear()}</span></p>
                <a className="back-top" href="#main">Back to top <ArrowDown size={14} /></a>
            </footer>
        </>
    );
}
