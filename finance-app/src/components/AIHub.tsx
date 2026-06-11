import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';

interface AIInsight {
  id: string; type: 'warning' | 'success' | 'info'; title: string; description: string; actionText?: string; metric?: string;
}

interface AIHubProps {
  aiData?: string | { insight: string; percentage: number; anomaly: string; action: string; };
  hasTransactions: boolean;
}

export default function AIHub({ aiData, hasTransactions }: AIHubProps) {
  if (!hasTransactions) return null;

  const insights: AIInsight[] = [];

  if (typeof aiData === 'object' && aiData !== null) {
    const isWarning = aiData.percentage < 0;
    insights.push({
      id: 'dynamic-1', type: isWarning ? 'warning' : 'success', title: aiData.anomaly || 'AI Analysis',
      description: aiData.insight, actionText: aiData.action, metric: `${aiData.percentage > 0 ? '+' : ''}${aiData.percentage}%`,
    });
  }

  insights.push(
    { id: 'mock-1', type: 'warning', title: 'Subscription Anomaly', description: 'Vercel Inc. and AWS charges are 15% higher this month.', actionText: 'Review Subscriptions', metric: '+$142.00' }
  );

  return (
    <div className="bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-sm flex flex-col relative transition-colors">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-[#121214]/80">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white tracking-tight">Copilot Intelligence</h3>
        </div>
        <button className="text-[11px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors flex items-center gap-1 outline-none">
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.02]">
        {insights.map((insight, index) => (
          <motion.div key={insight.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.1 }}
            className="group flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.015] transition-colors"
          >
            <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
              insight.type === 'warning' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-500' :
              insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600' :
              'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-500'
            }`}>
              {insight.type === 'warning' ? <AlertCircle size={12} strokeWidth={2.5} /> :
               insight.type === 'success' ? <TrendingUp size={12} strokeWidth={2.5} /> :
               <ArrowRight size={12} strokeWidth={2.5} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-0.5">
                <h4 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{insight.title}</h4>
                {insight.metric && <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${insight.type === 'warning' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'}`}>{insight.metric}</span>}
              </div>
              <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed pr-4 truncate">{insight.description}</p>
              
              {insight.actionText && (
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                    <span>{insight.actionText}</span>
                    <ChevronRight size={12} className="text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}