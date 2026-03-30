/**
 * Modo de teste para admin:
 * - O fluxo de validação sempre roda no cliente.
 * - O toggle define resultado simulado no endpoint de validação (`success` | `fail`).
 * - Nunca altera permissões da conta admin.
 * - Após sucesso, liberamos criação/finalização de plano nesta aba (sessionStorage).
 */

export const FORMACAO_GATE_ADMIN_TEST_HEADER = 'x-escola-test-formacao-sem-matricula'
export const FORMACAO_GATE_ADMIN_VALIDATE_MODE_HEADER = 'x-escola-admin-validate-mode'

const HEADER_VALUE_ON = '1'
export const STORAGE_KEY_FORMACAO_GATE_ADMIN_TEST = 'escola:admin-formacao-validate-success'
export const STORAGE_SESSION_ADMIN_TEST_HOTMART_OK = 'escola:formacao-admin-test-hotmart-ok'

export function readFormacaoGateAdminTestFlag(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // true => simular sucesso / false => simular falha
    return window.localStorage.getItem(STORAGE_KEY_FORMACAO_GATE_ADMIN_TEST) !== '0'
  } catch {
    return false
  }
}

export function writeFormacaoGateAdminTestFlag(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY_FORMACAO_GATE_ADMIN_TEST, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function readFormacaoAdminTestHotmartOk(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(STORAGE_SESSION_ADMIN_TEST_HOTMART_OK) === '1'
  } catch {
    return false
  }
}

export function markFormacaoAdminTestHotmartOk(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_SESSION_ADMIN_TEST_HOTMART_OK, '1')
  } catch {
    /* ignore */
  }
}

export function clearFormacaoAdminTestHotmartOk(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_SESSION_ADMIN_TEST_HOTMART_OK)
  } catch {
    /* ignore */
  }
}

/** Header de bloqueio para APIs de plano (até a validação simulada ter sucesso nesta aba). */
export function getFormacaoGateAdminTestFetchHeaders(isAdmin: boolean): Record<string, string> {
  if (!isAdmin) return {}
  if (readFormacaoAdminTestHotmartOk()) return {}
  return { [FORMACAO_GATE_ADMIN_TEST_HEADER]: HEADER_VALUE_ON }
}

/** Header para endpoint de validação: resultado simulado do fluxo (`success` | `fail`). */
export function getFormacaoGateAdminValidateModeHeaders(isAdmin: boolean): Record<string, string> {
  if (!isAdmin) return {}
  return {
    [FORMACAO_GATE_ADMIN_VALIDATE_MODE_HEADER]: readFormacaoGateAdminTestFlag() ? 'success' : 'fail',
  }
}

export function requestWantsAdminFormacaoGateSemMatricula(
  request: Request,
  profileRole: string | null | undefined
): boolean {
  if (profileRole !== 'admin') return false
  return request.headers.get(FORMACAO_GATE_ADMIN_TEST_HEADER)?.trim() === HEADER_VALUE_ON
}
