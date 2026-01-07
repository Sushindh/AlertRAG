import { useState } from "react";
import { Overview } from "./components/Overview";
import { Services } from "./components/Services";
import { Incidents } from "./components/Incidents";
import { IncidentAnalysis } from "./components/IncidentAnalysis";
import { Chat } from "./components/Chat";
import {
  LayoutDashboard,
  Server,
  AlertCircle,
  Brain,
  MessageSquare,
} from "lucide-react";

type Page =
  | "overview"
  | "services"
  | "incidents"
  | "analysis"
  | "chat";

export default function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("overview");

  const navItems = [
    {
      id: "overview" as Page,
      label: "Overview",
      icon: LayoutDashboard,
    },
    { id: "services" as Page, label: "Services", icon: Server },
    {
      id: "incidents" as Page,
      label: "Incidents",
      icon: AlertCircle,
    },
    {
      id: "analysis" as Page,
      label: "Incident Analysis",
      icon: Brain,
    },
    { id: "chat" as Page, label: "Chat", icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-gray-900">
              AlertRAG
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  currentPage === item.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-500">
                  Tenant
                </div>
                <div className="text-gray-900">amazon-demo</div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <div className="text-sm text-gray-500">
                  Environment
                </div>
                <div className="text-gray-900">Production</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-700">
                Live
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {currentPage === "overview" && (
            <Overview onNavigate={setCurrentPage} />
          )}
          {currentPage === "services" && (
            <Services onNavigate={setCurrentPage} />
          )}
          {currentPage === "incidents" && (
            <Incidents onNavigate={setCurrentPage} />
          )}
          {currentPage === "analysis" && <IncidentAnalysis />}
          {currentPage === "chat" && <Chat />}
        </main>
      </div>
    </div>
  );
}