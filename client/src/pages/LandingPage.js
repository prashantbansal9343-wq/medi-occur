import React, { useState } from "react";
import { Link } from "react-router-dom";

const portals = [
  {
    role: "RETAILER",
    short: "R",
    title: "Retailer",
    blurb: "Order medicines, manage cart, and track deliveries to your shop.",
    info: "Search the live catalogue, place slot-based orders, pay on delivery with OTP, and view past bills with offline challan photos.",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    accent: "cyan",
  },
  {
    role: "WHOLESALER",
    short: "W",
    title: "Wholesaler",
    blurb: "Accept retailer requests, manage stock, and dispatch orders.",
    info: "Get a 5-minute accept/reject alert with shop details, keep searchable inventory that retailers browse, and track bills from pack to delivery.",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    accent: "indigo",
  },
  {
    role: "DELIVERY",
    short: "D",
    title: "Delivery",
    blurb: "Collect from wholesalers and drop off at retailer shops.",
    info: "Work wholesaler-by-wholesaler: collect per retailer with OTP and photo proof, then deliver with verification. Profile is company-verified.",
    image:
      "https://images.unsplash.com/photo-1566576721346-d4a3b4e0d0bb?auto=format&fit=crop&w=800&q=80",
    accent: "amber",
  },
  {
    role: "ADMIN",
    short: "A",
    title: "Admin",
    blurb: "Oversee retailers and wholesalers city-wise.",
    info: "Search a city, browse wholesalers and retailers, open ID/QR and registration details, then drill into bills and activity.",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
    accent: "slate",
  },
];

const accentBtn = {
  cyan: "bg-cyan-600 hover:bg-cyan-500",
  indigo: "bg-indigo-600 hover:bg-indigo-500",
  amber: "bg-amber-600 hover:bg-amber-500",
  slate: "bg-slate-600 hover:bg-slate-500",
};

function PortalCard({ portal, onInfo }) {
  return (
    <article className="group rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-white/25 transition shadow-lg flex flex-col">
      <div className="relative h-36 overflow-hidden">
        <img
          src={portal.image}
          alt=""
          className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <span className="absolute top-2.5 left-2.5 w-7 h-7 rounded-md bg-white/15 backdrop-blur text-white text-xs font-bold flex items-center justify-center border border-white/20">
          {portal.short}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onInfo(portal);
          }}
          className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-black/45 backdrop-blur text-[11px] font-semibold text-white border border-white/20 hover:bg-black/60"
        >
          Info
        </button>
        <h3 className="absolute bottom-2.5 left-3 right-3 text-base font-semibold text-white drop-shadow">
          {portal.title}
        </h3>
      </div>
      <div className="p-3.5 flex flex-col flex-1 gap-3">
        <p className="text-slate-400 text-xs leading-relaxed flex-1">{portal.blurb}</p>
        <Link
          to={`/portal?role=${portal.role}`}
          className={`text-center py-2 rounded-lg text-xs font-semibold text-white transition ${accentBtn[portal.accent]}`}
        >
          Enter {portal.title}
        </Link>
      </div>
    </article>
  );
}

export default function LandingPage() {
  const [infoPortal, setInfoPortal] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs shadow group-hover:opacity-90">
              M
            </span>
            <span className="text-sm font-semibold tracking-tight">Medifield</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1 text-xs font-medium">
            <a href="#home" className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/5">
              Home
            </a>
            <a href="#about" className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/5">
              About us
            </a>
            <a href="#portals" className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/5">
              Portals
            </a>
            <a href="#contact" className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/5">
              Contact us
            </a>
          </nav>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-35 animate-[pulse_8s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/85 to-slate-950" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-16 sm:pt-20 sm:pb-20">
          <p className="text-cyan-300/90 text-[11px] font-semibold uppercase tracking-[0.2em] mb-3">
            Pharma supply network
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-snug max-w-xl mb-4">
            Order, fulfill, and deliver medicines — one platform for every role.
          </h1>
          <p className="text-sm text-slate-300 max-w-lg leading-relaxed mb-6">
            Retailers, wholesalers, delivery partners, and admins — pick your portal below.
          </p>
          <a
            href="#portals"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold transition"
          >
            Choose portal
          </a>
        </div>
      </section>

      <section id="about" className="max-w-5xl mx-auto px-4 py-12 border-t border-white/5">
        <h2 className="text-lg font-semibold mb-2">About us</h2>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Medifield connects local medical retailers with nearby wholesalers and verified
          delivery partners. Orders follow time slots, live matching uses shop location in
          the background, and bills include both an online summary and an offline challan photo.
        </p>
      </section>

      <section id="portals" className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Portals</h2>
          <p className="text-xs text-slate-400 mt-1">
            Tap Info for details, or Enter to login / register for that role.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {portals.map((p) => (
            <PortalCard key={p.role} portal={p} onInfo={setInfoPortal} />
          ))}
        </div>
      </section>

      <section id="contact" className="max-w-5xl mx-auto px-4 py-12 border-t border-white/5">
        <h2 className="text-lg font-semibold mb-2">Contact us</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Customer care:{" "}
          <a className="text-cyan-300 hover:text-cyan-200" href="mailto:care@medifield.demo">
            care@medifield.demo
          </a>
          {" · "}
          <a className="text-cyan-300 hover:text-cyan-200" href="tel:+911800123456">
            1800-123-456
          </a>
        </p>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-slate-500 text-xs">
        © {new Date().getFullYear()} Medifield
      </footer>

      {infoPortal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setInfoPortal(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-slate-900 border border-white/15 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{infoPortal.short} portal</p>
                <h3 className="text-base font-semibold text-white">{infoPortal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoPortal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{infoPortal.info}</p>
            <Link
              to={`/portal?role=${infoPortal.role}`}
              className={`block text-center py-2 rounded-lg text-sm font-semibold text-white ${accentBtn[infoPortal.accent]}`}
              onClick={() => setInfoPortal(null)}
            >
              Continue to {infoPortal.title}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
