'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import LeadsGraph from '@/components/LeadsGraph'
import { UserIcon } from '@/components/icons/UserIcon'
import { supabase } from '@/lib/supabase'
import LeadsTable from '@/components/LeadsTable'
import TopSourcesChart from '@/components/TopSourcesChart'
import TopAffiliatesChart from '@/components/TopAffiliatesChart'

const menuItems = [
  {
    title: 'Dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    href: '/dashboard'
  },
 
]

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalLeads: 0,
    monthlyLeads: 0,
    weeklyLeads: 0
  })

  const fetchStats = async () => {
    try {
      // Get current month's and week's start/end dates
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
      
      // Calculate start of week (Sunday)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      // Calculate end of week (Saturday)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      // Fetch total leads
      const [{ count: waitingListCount }, { count: iscasCount }] = await Promise.all([
        supabase
          .from('waiting_list')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('iscas')
          .select('*', { count: 'exact', head: true })
      ])

      // Fetch monthly leads
      const [monthlyWaitingList, monthlyIscas] = await Promise.all([
        supabase
          .from('waiting_list')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth),
        supabase
          .from('iscas')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth)
      ])

      // Fetch weekly leads
      const [weeklyWaitingList, weeklyIscas] = await Promise.all([
        supabase
          .from('waiting_list')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString()),
        supabase
          .from('iscas')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString())
      ])

      setStats({
        totalLeads: (waitingListCount || 0) + (iscasCount || 0),
        monthlyLeads: (monthlyWaitingList.count || 0) + (monthlyIscas.count || 0),
        weeklyLeads: (weeklyWaitingList.count || 0) + (weeklyIscas.count || 0)
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-zinc-900 border-r border-white/10 w-64`}
      >
        <div className="h-full px-3 py-4 flex flex-col">
          <div className="mb-10 pl-3">
            <h1 className="text-2xl font-bold text-yellow-400">Nova Era</h1>
          </div>
          
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-yellow-400 text-black' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/10 pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors w-full"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`${isSidebarOpen ? 'ml-64' : 'ml-0'} transition-margin duration-300 min-h-screen`}>
        {/* Top bar */}
        <header className="bg-zinc-900/50 border-b border-white/10 backdrop-blur-sm">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">
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
              <TopSourcesChart />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TopAffiliatesChart />
            </motion.div>
          </div>

          {/* Leads Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <LeadsGraph />
          </motion.div>

          {/* Leads Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <LeadsTable />
          </motion.div>
        </main>
      </div>
    </div>
  )
} 