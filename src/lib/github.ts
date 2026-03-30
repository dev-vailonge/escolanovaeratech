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

const GITHUB_REPO_CHECK_MS = 12_000

/**
 * Verifica se um repositório GitHub existe (público).
 * @returns true = existe, false = não encontrado ou erro de rede, null = timeout (não concluiu a tempo)
 */
export async function checkRepoExists(owner: string, repo: string): Promise<boolean | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GITHUB_REPO_CHECK_MS)
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'EscolaNovaEra-App',
      },
      signal: controller.signal,
    })

    return response.status === 200
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null
    }
    console.error('Erro ao verificar repositório GitHub:', error)
    return false
  } finally {
    clearTimeout(timeoutId)
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
  
  const exists = await checkRepoExists(repoInfo.owner, repoInfo.repo)
  if (exists === null) {
    return {
      valid: false,
      error:
        'Tempo esgotado ao falar com o GitHub. Tente de novo em alguns segundos ou confira sua conexão.',
      repoInfo,
    }
  }
  if (!exists) {
    return {
      valid: false,
      error: 'Repositório não encontrado. Verifique se o repositório é público e se a URL está correta.',
      repoInfo,
    }
  }
  
  return {
    valid: true,
    repoInfo
  }
}





