/**
 * Filtro de console para suprimir erros de extensões do navegador
 * que poluem o console em produção sem afetar a aplicação.
 * 
 * Esses erros são comuns e não afetam a funcionalidade da aplicação:
 * - Extensões tentando injetar scripts em frames que não existem mais
 * - Extensões tentando conectar a serviços locais que não estão rodando
 * - Extensões com arquivos faltando ou mal configuradas
 */

// Verifica se está em desenvolvimento (baseado na URL ou hostname)
function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost') ||
    window.location.port !== ''
  )
}

// Padrões de erros de extensões que devem ser suprimidos
const EXTENSION_ERROR_PATTERNS: (RegExp | string)[] = [
  // Erros de background.js (extensões)
  /background\.js/,
  /FrameDoesNotExistError/,
  /FrameIsBrowserFrameError/,
  
  // Erros de runtime.lastError (extensões Chrome)
  /runtime\.lastError/,
  /The message port closed/,
  /Could not establish connection/,
  /Receiving end does not exist/,
  /moved into back\/forward cache/,
  
  // Erros de conexão localhost (extensões tentando conectar)
  /127\.0\.0\.1:\d+\/ingest/,
  /localhost:\d+/,
  /ERR_CONNECTION_REFUSED/,
  
  // Arquivos de extensões não encontrados
  /share-modal\.js/,
  /utils\.js.*extension/i,
  /extensionState\.js/,
  /heuristicsRedefinitions\.js/,
  /ERR_FILE_NOT_FOUND.*extension/i,
  
  // Erros de content scripts de extensões
  /content.*script/i,
  /chrome-extension:/,
  /moz-extension:/,
  /safari-extension:/,
]

/**
 * Verifica se um erro deve ser suprimido (é de extensão)
 */
function shouldSuppressError(message: string, source?: string): boolean {
  const fullMessage = `${message} ${source || ''}`.toLowerCase()
  
  return EXTENSION_ERROR_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(fullMessage)
    }
    if (typeof pattern === 'string') {
      return fullMessage.includes(pattern.toLowerCase())
    }
    return false
  })
}

/**
 * Filtro para console.error
 */
if (typeof window !== 'undefined') {
  const originalError = console.error.bind(console)
  console.error = function(...args: any[]) {
    const message = args.join(' ')
    
    // Em desenvolvimento, mostrar todos os erros
    if (isDevelopment()) {
      originalError(...args)
      return
    }
    
    // Em produção, filtrar erros de extensões
    if (!shouldSuppressError(message)) {
      originalError(...args)
    }
  }

  /**
   * Filtro para console.warn (alguns erros aparecem como warn)
   */
  const originalWarn = console.warn.bind(console)
  console.warn = function(...args: any[]) {
    const message = args.join(' ')
    
    // Em desenvolvimento, mostrar todos os warnings
    if (isDevelopment()) {
      originalWarn(...args)
      return
    }
    
    // Em produção, filtrar warnings de extensões
    if (!shouldSuppressError(message)) {
      originalWarn(...args)
    }
  }

  /**
   * Intercepta erros não capturados (unhandled errors)
   */
  const originalOnError = window.onerror
  
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = `${message} ${source || ''}`
    
    // Em desenvolvimento, mostrar todos os erros
    if (isDevelopment()) {
      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error)
      }
      return false
    }
    
    // Em produção, filtrar erros de extensões
    if (shouldSuppressError(errorMessage, source || undefined)) {
      return true // Suprime o erro
    }
    
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error)
    }
    return false
  }
  
  // Intercepta promises rejeitadas não tratadas
  const originalUnhandledRejection = window.onunhandledrejection
  
  window.onunhandledrejection = function(event: PromiseRejectionEvent) {
    const message = event.reason?.message || String(event.reason || '')
    
    // Em desenvolvimento, mostrar todos os erros
    if (isDevelopment()) {
      if (originalUnhandledRejection) {
        return originalUnhandledRejection.call(window, event)
      }
      return false
    }
    
    // Em produção, filtrar erros de extensões
    if (shouldSuppressError(message)) {
      event.preventDefault() // Suprime o erro
      return true
    }
    
    if (originalUnhandledRejection) {
      return originalUnhandledRejection.call(window, event)
    }
    return false
  }
}

/**
 * Exporta função para verificar se um erro deve ser suprimido
 * (útil para testes ou debug)
 */
export function isExtensionError(message: string, source?: string): boolean {
  return shouldSuppressError(message, source)
}
