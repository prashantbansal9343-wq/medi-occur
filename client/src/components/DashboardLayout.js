import React from "react";
import NotificationBell from "./NotificationBell";
import LocationPrompt from "./LocationPrompt";
import { mediaUrl } from "../utils/api";

const roleLabels = {
  RETAILER: "Retailer",
  WHOLESALER: "Wholesaler",
  DELIVERY: "Delivery",
  ADMIN: "Admin",
};

export default function DashboardLayout({
  user,
  setUser,
  pageTitle,
  pageSubtitle,
  onSignOut,
  children,
  cartCount = 0,
  onCartClick,
  navItems = [],
  activeNavId,
  onNavSelect,
}) {
  const badge = roleLabels[user?.role] || user?.role || "User";
  const avatar = user?.profile?.profileImageUrl;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_55%,_#020617_100%)] text-white">
      <LocationPrompt user={user} setUser={setUser} />
      <header className="bg-slate-950/80 border-b border-cyan-400/15 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => onNavSelect?.("shop") || window.scrollTo({ top: 0, behavior: "smooth" })}
              className="shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] hover:opacity-90"
              aria-label="Home"
            >
              M
            </button>
            <div className="min-w-0 hidden xs:block sm:block">
              <p className="text-[9px] font-medium uppercase tracking-wider text-cyan-300/90 leading-none">
                Medifield
              </p>
              <p className="text-xs font-semibold text-white truncate leading-tight">{pageTitle}</p>
            </div>
            {navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-0.5 ml-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavSelect?.(item.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      activeNavId === item.id
                        ? "bg-cyan-500/20 text-cyan-200"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {typeof onCartClick === "function" && (
              <button
                type="button"
                onClick={onCartClick}
                className="relative px-2 py-1 rounded-md text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10 border border-emerald-400/20"
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            )}
            <NotificationBell />
            <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-200 border border-cyan-300/20">
              {badge}
            </span>
            <button
              type="button"
              onClick={() => onNavSelect?.("profile")}
              className="flex items-center gap-1.5 rounded-md hover:bg-white/5 px-1 py-0.5"
              title="Profile"
            >
              {avatar ? (
                <img
                  src={mediaUrl(avatar)}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border border-cyan-400/30"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                  {(user?.name || "U").slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="text-[11px] font-semibold text-rose-300 hover:text-white px-2 py-1 rounded-md hover:bg-rose-500/15"
            >
              Sign out
            </button>
          </div>
        </div>
        {navItems.length > 0 && (
          <div className="md:hidden border-t border-white/5 px-3 py-1.5 flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavSelect?.(item.id)}
                className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                  activeNavId === item.id
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-slate-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
        {pageSubtitle ? <p className="text-slate-400 mb-4 text-sm">{pageSubtitle}</p> : null}
        {children}
      </main>
    </div>
  );
}
