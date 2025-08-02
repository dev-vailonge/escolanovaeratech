"use client"

import { motion } from 'framer-motion'
import { UserIcon } from '@/components/icons/UserIcon'
import LeadsGraph from '@/components/LeadsGraph'
import LeadsTable from '@/components/LeadsTable'
import TopSourcesChart from '@/components/TopSourcesChart'
import TopAffiliatesChart from '@/components/TopAffiliatesChart'
import MonthlyComparisonChart from '@/components/MonthlyComparisonChart'

interface DashboardContentProps {
  stats: {
    totalLeads: number
    monthlyLeads: number
    weeklyLeads: number
  }
  topSources: { source: string; count: number }[]
  topAffiliates: { affiliate: string; count: number }[]
  leadsGraph: { date: string; iscas: number; waiting_list: number }[]
  leadsTable: any[]
  monthlyComparison: { month: string; total: number }[]
}

export default function DashboardContent({ stats, topSources, topAffiliates, leadsGraph, leadsTable, monthlyComparison }: DashboardContentProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 p-6 rounded-xl border border-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400/10 rounded-lg">
              <UserIcon className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Leads</p>
              <p className="text-2xl font-semibold text-white">
                {stats.totalLeads.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 p-6 rounded-xl border border-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400/10 rounded-lg">
              <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Leads do Mês</p>
              <p className="text-2xl font-semibold text-white">
                {stats.monthlyLeads.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 p-6 rounded-xl border border-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400/10 rounded-lg">
              <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Leads da Semana</p>
              <p className="text-2xl font-semibold text-white">
                {stats.weeklyLeads.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TopSourcesChart data={topSources} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TopAffiliatesChart data={topAffiliates} />
        </motion.div>
      </div>
      {/* Leads Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <LeadsGraph data={leadsGraph} />
      </motion.div>
      {/* Monthly Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-6"
      >
        <MonthlyComparisonChart data={monthlyComparison} />
      </motion.div>
    </>
  )
} 