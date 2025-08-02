import { NextRequest, NextResponse } from 'next/server'

interface KiwifySale {
  id: string
  reference: string
  type: string
  created_at: string
  updated_at: string
  product: {
    id: string
    name: string
  }
  shipping: {
    id: string
    name: string
    price: number
  }
  status: string
  payment_method: string
  net_amount: number
  currency: string
  customer: {
    id: string
    name: string
    email: string
    cpf: string
    mobile: string
    instagram?: string
    country: string
    address: {
      street: string
      number: string
      complement?: string
      neighborhood: string
      city: string
      state: string
      zipcode: string
    }
  }
}

interface KiwifyResponse {
  pagination: {
    count: number
    page_number: number
    page_size: number
  }
  data: KiwifySale[]
}

interface OAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

async function getKiwifyToken(): Promise<string | null> {
  const CLIENT_ID = process.env.KIWIFY_CLIENT_ID
  const CLIENT_SECRET = process.env.KIWIFY_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return null
  }

  try {
    const tokenResponse = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    })

    if (!tokenResponse.ok) {
      return null
    }

    const tokenData: OAuthResponse = await tokenResponse.json()
    return tokenData.access_token
  } catch (error) {
    return null
  }
}

async function fetchKiwifySales(page = 1, pageSize = 100): Promise<KiwifyResponse> {
  const accessToken = await getKiwifyToken()
  
  if (!accessToken) {
    return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
  }

  const KIWIFY_ACCOUNT_ID = process.env.KIWIFY_ACCOUNT_ID
  
  if (!KIWIFY_ACCOUNT_ID) {
    return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
  }

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 90)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const url = `https://public-api.kiwify.com/v1/sales?page_number=${page}&page_size=${pageSize}&start_date=${startDateStr}&end_date=${endDateStr}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-kiwify-account-id': KIWIFY_ACCOUNT_ID,
      },
    })

    if (!response.ok) {
      return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
    }

    const data: KiwifyResponse = await response.json()
    return data
  } catch (error) {
    return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
  }
}

export async function GET(request: NextRequest) {
  try {
    const kiwifyData = await fetchKiwifySales()
    
    // Process sales data for charts and stats
    const sales = kiwifyData.data || []
    
    // Calculate stats with proper number parsing
    const totalSales = sales.length
    
    // Calculate revenue by currency
    const totalRevenueBRL = sales.reduce((sum: number, sale: KiwifySale) => {
      if (sale.currency === 'BRL') {
        const amountInCents = Number(sale.net_amount) || 0
        const amountInCurrency = amountInCents / 100
        return sum + amountInCurrency
      }
      return sum
    }, 0)
    
    const totalRevenueUSD = sales.reduce((sum: number, sale: KiwifySale) => {
      if (sale.currency === 'USD') {
        const amountInCents = Number(sale.net_amount) || 0
        const amountInCurrency = amountInCents / 100
        return sum + amountInCurrency
      }
      return sum
    }, 0)
    
    // Total revenue is sum of both currencies
    const totalRevenue = totalRevenueBRL + totalRevenueUSD
    
    const paidSales = sales.filter((sale: KiwifySale) => sale.status === 'paid').length
    const conversionRate = totalSales > 0 ? (paidSales / totalSales) * 100 : 0

    // Generate daily sales data for the last 15 days
    const dailySales = []
    const now = new Date()
    for (let i = 14; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const daySales = sales.filter((sale: KiwifySale) => 
        sale.created_at.split('T')[0] === dateStr
      )
      
      const dayRevenue = daySales.reduce((sum: number, sale: KiwifySale) => {
        const amountInCents = Number(sale.net_amount) || 0
        const amountInCurrency = amountInCents / 100
        return sum + amountInCurrency
      }, 0)
      
      dailySales.push({
        date: dateStr,
        sales: daySales.length,
        revenue: dayRevenue
      })
    }

    // Generate monthly sales data for the last 12 months
    const monthlySales = []
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = date.getMonth()
      
      const monthSales = sales.filter((sale: KiwifySale) => {
        const saleDate = new Date(sale.created_at)
        return saleDate.getFullYear() === year && saleDate.getMonth() === month
      })
      
      const monthRevenue = monthSales.reduce((sum: number, sale: KiwifySale) => {
        const amountInCents = Number(sale.net_amount) || 0
        const amountInCurrency = amountInCents / 100
        return sum + amountInCurrency
      }, 0)
      
      monthlySales.push({
        month: monthNames[month],
        sales: monthSales.length,
        revenue: monthRevenue
      })
    }

    // Get top products
    const productSales: Record<string, { sales: number; revenue: number }> = {}
    sales.forEach((sale: KiwifySale) => {
      const productName = sale.product.name
      const amountInCents = Number(sale.net_amount) || 0
      const amountInCurrency = amountInCents / 100
      
      if (!productSales[productName]) {
        productSales[productName] = { sales: 0, revenue: 0 }
      }
      productSales[productName].sales++
      productSales[productName].revenue += amountInCurrency
    })

    const topProducts = Object.entries(productSales)
      .map(([product, data]) => ({
        product,
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3)

    // Get top payment methods
    const paymentMethodSales: Record<string, { count: number; revenue: number }> = {}
    sales.forEach((sale: KiwifySale) => {
      const paymentMethod = sale.payment_method || 'Unknown'
      const amountInCents = Number(sale.net_amount) || 0
      const amountInCurrency = amountInCents / 100
      
      if (!paymentMethodSales[paymentMethod]) {
        paymentMethodSales[paymentMethod] = { count: 0, revenue: 0 }
      }
      paymentMethodSales[paymentMethod].count++
      paymentMethodSales[paymentMethod].revenue += amountInCurrency
    })

    const topPaymentMethods = Object.entries(paymentMethodSales)
      .map(([method, data]) => ({
        method,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return NextResponse.json({
      stats: {
        totalSales,
        totalRevenueBRL,
        totalRevenueUSD,
        totalRevenue,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      dailySales,
      monthlySales,
      topProducts,
      topPaymentMethods,
      sales
    })
  } catch (error) {
    console.error('Error processing sales data:', error)
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 })
  }
} 