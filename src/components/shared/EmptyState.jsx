import React from "react";
import { FileX } from "lucide-react";

export default function EmptyState({ 
  icon: Icon = FileX, 
  title, 
  description, 
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}