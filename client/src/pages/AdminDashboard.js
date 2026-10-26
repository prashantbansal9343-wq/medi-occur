import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import AdminMedicineCatalogue from "../components/AdminMedicineCatalogue";
import api from "../utils/api";
import { getSocket } from "../utils/socket";
import { disconnectSocket } from "../utils/socket";

const metricSkeleton = [
  { label: "Retailers on network", key: "retailers" },
  { label: "Wholesalers on network", key: "wholesalers" },
  { label: "Orders (last 30 days)", key: "orders" },
  { label: "Active deliveries", key: "deliveries" },
];

export default function AdminDashboard({ setUser, user }) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [metrics, setMetrics] = React.useState(null);
  const [recentOrders, setRecentOrders] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/overview");
        setMetrics(res.data.metrics);
        setRecentOrders(res.data.recentOrders || []);
      } catch {
        setMetrics(null);
      }
    };
    load();
    const socket = getSocket();
    const onOrderEvent = () => load();
    socket?.on("order:created", onOrderEvent);
    socket?.on("order:updated", onOrderEvent);
    return () => {
      socket?.off("order:created", onOrderEvent);
      socket?.off("order:updated", onOrderEvent);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
    navigate("/signin?portal=ADMIN", { replace: true });
  };

  return (
    <DashboardLayout
      user={user}
      setUser={setUser}
      pageTitle="Administration"
      pageSubtitle="Executive view of your Medifield network. Connect analytics APIs to populate live figures."
      onSignOut={handleSignOut}
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "medicines", label: "Medicine catalogue" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-cyan-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "medicines" && <AdminMedicineCatalogue />}

      {activeTab === "overview" && (
      <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {metricSkeleton.map((s) => (
          <div
            key={s.key}
            className="bg-slate-900/60 rounded-xl border border-cyan-300/20 p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {s.label}
            </p>
            <p className="text-2xl font-semibold text-white mt-3 tabular-nums">
              {metrics
                ? s.key === "retailers"
                  ? metrics.retailers
                  : s.key === "wholesalers"
                  ? metrics.wholesalers
                  : s.key === "orders"
                  ? metrics.totalOrders
                  : metrics.activeDeliveries
                : "—"}
            </p>
            <p className="text-xs text-cyan-200/70 mt-2">{metrics ? "Live data" : "Awaiting data source"}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 rounded-xl border border-cyan-300/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-300/10">
          <h2 className="text-lg font-semibold text-white">
            Recent activity
          </h2>
          <p className="text-sm text-slate-400 mt-1">Latest network activity across roles.</p>
        </div>
        <div className="px-6 py-6">
          {recentOrders.length === 0 && <p className="text-sm text-slate-400">No recent activity.</p>}
          {recentOrders.map((order) => (
            <div key={order._id} className="py-2 border-b border-cyan-300/10 text-sm text-slate-200">
              #{order._id.slice(-6).toUpperCase()} · {order.status} · Retailer: {order.retailer?.name || "N/A"}
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </DashboardLayout>
  );
}
