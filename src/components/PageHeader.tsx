// src/components/PageHeader.tsx - CLEAN PAGE HEADERS
"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`bg-white border-b border-gray-100 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {Icon && (
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-sm">
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>

          {actions && (
            <div className="flex items-center space-x-3">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
