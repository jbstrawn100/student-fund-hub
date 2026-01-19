import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp,
  color = "indigo" 
}) {
  const colorClasses = {
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-500/25",
    violet: "from-violet-500 to-violet-600 shadow-violet-500/25",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/25",
    amber: "from-amber-500 to-amber-600 shadow-amber-500/25",
    rose: "from-rose-500 to-rose-600 shadow-rose-500/25",
    blue: "from-blue-500 to-blue-600 shadow-blue-500/25",
  };

  return (
    <Card className="p-6 bg-white/70 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={`text-xs font-medium ${trendUp ? "text-emerald-600" : "text-slate-500"}`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
}