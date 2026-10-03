import { useState } from "react";
import { IncidentDashboard } from "./components/IncidentDashboard";
import { MetricsPanel } from "./components/MetricsPanel";
import { SREChat } from "./components/SREChat";
import { LayoutDashboard, BarChart2, MessageSquare, Zap } from "lucide-react";
import "./index.css";

type Page = "dashboard" | "metrics" | "chat";

const navItems = [
  { id: "dashboard" as Page, label: "Incident Dashboard", icon: LayoutDashboard },
  { id: "metrics"   as Page, label: "Live Metrics",       icon: BarChart2        },
  { id: "chat"      as Page, label: "SRE Chat",           icon: MessageSquare    },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <Zap size={18} color="#fff" />
            </div>
            <div className="logo-text">
              <span className="logo-name">AlertRAG</span>
              <span className="logo-tagline">SRE Agent</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Monitoring</div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`nav-item ${page === item.id ? "active" : ""}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-meta">
              <span className="label">Service</span>
              <span className="value">payment-service</span>
            </div>
            <div className="topbar-divider" />
            <div className="topbar-meta">
              <span className="label">Environment</span>
              <span className="value">Production</span>
            </div>
            <div className="topbar-divider" />
            <div className="topbar-meta">
              <span className="label">Model</span>
              <span className="value">gemma3:4b</span>
            </div>
          </div>
          <div className="live-dot">
            <div className="pulse" />
            <span>Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {page === "dashboard" && <IncidentDashboard />}
          {page === "metrics"   && <MetricsPanel />}
          {page === "chat"      && <SREChat />}
        </main>
      </div>
    </div>
  );
}