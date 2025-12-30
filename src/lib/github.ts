/**
 * Utilitários para validação e interação com GitHub
 */

// Regex para validar URLs do GitHub
const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i

// Regex mais flexível para aceitar subpaths (branches, etc)
const GITHUB_REPO_REGEX = /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/i

export interface GitHubRepoInfo {
  owner: string
  repo: string
  fullUrl: string
  isValid: boolean
}

/**
 * Valida se uma URL é do GitHub
 */
export function isValidGitHubUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  return GITHUB_REPO_REGEX.test(url.trim())
}

/**
 * Extrai informações do repositório de uma URL do GitHub
 */
export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  if (!url) return null
  
  const match = url.trim().match(GITHUB_REPO_REGEX)
  if (!match) return null
  
  const owner = match[2]
  const repo = match[3].replace(/\.git$/, '') // Remove .git se houver
  
  return {
    owner,
    repo,
    fullUrl: `https://github.com/${owner}/${repo}`,
    isValid: true
  }
}

/**
 * Verifica se um repositório GitHub existe (público)
 * Usa a API pública do GitHub, sem necessidade de token
 */
export async function checkRepoExists(owner: string, repo: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EscolaNovaEra-App'
      }
    })
    
    return response.status === 200
  } catch (error) {
    console.error('Erro ao verificar repositório GitHub:', error)
    return false
  }
}

/**
 * Valida URL do GitHub e verifica se o repositório existe
 */
export async function validateGitHubRepo(url: string): Promise<{
  valid: boolean
  error?: string
  repoInfo?: GitHubRepoInfo
}> {
  // Validar formato da URL
  const repoInfo = parseGitHubUrl(url)
  if (!repoInfo) {
    return {
      valid: false,
      error: 'URL inválida. Use o formato: https://github.com/usuario/repositorio'
    }
  }
  
  // Verificar se o repositório existe
  const exists = await checkRepoExists(repoInfo.owner, repoInfo.repo)
  if (!exists) {
    return {
      valid: false,
      error: 'Repositório não encontrado. Verifique se o repositório é público e se a URL está correta.',
      repoInfo
    }
  }
  
  return {
    valid: true,
    repoInfo
  }
}



