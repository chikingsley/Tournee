import { Activity, Calendar, DollarSign, Users } from "lucide-react";
import type React from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bowler, Event } from "../types";

type DashboardProps = {
  events: Event[];
  bowlers: Bowler[];
};

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
    <div>
      <p className="font-medium text-slate-500 text-sm">{title}</p>
      <h3 className="mt-1 font-bold text-2xl text-slate-900">{value}</h3>
    </div>
    <div className={`rounded-lg p-3 ${color}`}>{icon}</div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ events, bowlers }) => {
  const activeEvents = events.filter((e) => e.status === "ACTIVE");
  const upcomingEvents = events.filter((e) => e.status === "UPCOMING");
  const _completedEvents = events.filter((e) => e.status === "COMPLETED");

  const totalPrize = events.reduce((acc, curr) => acc + curr.prizeFund, 0);

  // Mock data for the chart
  const data = events.slice(0, 5).map((e) => ({
    name: e.name.split(" ")[0], // Short name
    entries: e.registeredBowlerIds.length,
    money: e.prizeFund,
  }));

  return (
    <div className="animate-fadeIn space-y-8">
      <div>
        <h1 className="font-bold text-2xl text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back, Organizer.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          color="bg-indigo-50"
          icon={<Activity className="text-indigo-600" size={24} />}
          title="Active Events"
          value={activeEvents.length}
        />
        <StatCard
          color="bg-blue-50"
          icon={<Users className="text-blue-600" size={24} />}
          title="Total Bowlers"
          value={bowlers.length}
        />
        <StatCard
          color="bg-orange-50"
          icon={<Calendar className="text-orange-600" size={24} />}
          title="Events This Month"
          value={upcomingEvents.length}
        />
        <StatCard
          color="bg-green-50"
          icon={<DollarSign className="text-green-600" size={24} />}
          title="Total Payouts"
          value={`$${totalPrize.toLocaleString()}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart Section */}
        <div className="h-96 rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-6 font-bold text-lg text-slate-800">
            Recent Event Participation
          </h3>
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="name"
                tick={{ fill: "#64748b" }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "#64748b" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                cursor={{ fill: "#f1f5f9" }}
              />
              <Bar
                barSize={40}
                dataKey="entries"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions / Recent Activity */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-lg text-slate-800">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              className="group flex items-center rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100"
              to="/events"
            >
              <div className="rounded bg-white p-2 text-indigo-600 shadow-sm group-hover:shadow">
                <Activity size={18} />
              </div>
              <span className="ml-3 font-medium text-slate-700">
                Manage Active Tournament
              </span>
            </Link>
            <Link
              className="group flex items-center rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100"
              to="/bowlers"
            >
              <div className="rounded bg-white p-2 text-blue-600 shadow-sm group-hover:shadow">
                <Users size={18} />
              </div>
              <span className="ml-3 font-medium text-slate-700">
                Add New Bowler
              </span>
            </Link>
          </div>

          <h3 className="mt-8 mb-4 font-bold text-lg text-slate-800">
            Recent Events
          </h3>
          <div className="space-y-4">
            {events.slice(0, 3).map((e) => (
              <div
                className="flex items-center justify-between border-slate-50 border-b pb-2 last:border-0"
                key={e.id}
              >
                <div>
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <p className="text-slate-500 text-xs">{e.date}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 font-medium text-xs ${e.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
