# Template de Email de Redefinição de Senha - Nova Era Tech

Template HTML para email de redefinição de senha usando as cores do design system (Amarelo #facc15 e Preto #000000).

## Código para copiar no Supabase Auth Email Template

Cole o código abaixo no campo "Body" (aba Source) da configuração "Reset password" no Supabase Dashboard.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir sua senha - Nova Era Tech</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container principal -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header com logo/branding -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <!-- Logo circular (já vem em formato circular) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <!-- Logo SVG circular - usar URL hospedada do logo_light_circle.svg -->
                    <!-- Nota: Para produção, substitua pela URL completa do logo hospedado no seu servidor -->
                    <img src="https://www.escolanovaeratech.com.br/logo_light_circle.svg" alt="Escola Nova Era Tech" width="96" height="96" style="display: block; margin: 0 auto; max-width: 96px; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #facc15; letter-spacing: -0.5px;">
                      Escola Nova Era Tech
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color: #18181b; border-radius: 12px; padding: 48px 32px; border: 1px solid rgba(250, 204, 21, 0.2);">
              
              <!-- Ícone de cadeado -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="width: 80px; height: 80px; background-color: rgba(250, 204, 21, 0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 2px solid rgba(250, 204, 21, 0.3);">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Título -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <h2 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; line-height: 1.3;">
                      Redefinir sua senha
                    </h2>
                  </td>
                </tr>
              </table>

              <!-- Mensagem -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #9ca3af;">
                      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Botão de redefinição -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background-color: #facc15; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(250, 204, 21, 0.3);">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link alternativo -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #facc15; word-break: break-all; padding: 12px; background-color: rgba(250, 204, 21, 0.1); border-radius: 6px; border: 1px solid rgba(250, 204, 21, 0.2);">
                      {{ .ConfirmationURL }}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px 0; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6b7280; text-align: center;">
                      Este link expira em 1 hora. Por segurança, não compartilhe este link com ninguém.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 40px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #facc15;">Nova Era Tech</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Aprenda programação com estratégia
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #6b7280;">
                Se você não solicitou esta alteração, ignore este e-mail ou entre em contato conosco.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Cores utilizadas

- **Amarelo primário**: `#facc15` (yellow-400)
- **Amarelo hover**: `#fbbf24` (yellow-500)
- **Fundo escuro**: `#000000` (black)
- **Card background**: `#18181b` (zinc-900)
- **Texto principal**: `#ffffff` (white)
- **Texto secundário**: `#9ca3af` (gray-400)
- **Texto terciário**: `#6b7280` (gray-500)

## Variáveis do Supabase disponíveis

- `{{ .ConfirmationURL }}` - URL de redefinição de senha (obrigatório)
- `{{ .Email }}` - Email do usuário
- `{{ .SiteURL }}` - URL do site
- `{{ .Token }}` - Token de redefinição
- `{{ .RedirectTo }}` - URL de redirecionamento

## Preview

O template é responsivo e funciona bem na maioria dos clientes de email. Use a aba "Preview" no Supabase para visualizar antes de salvar.

## Diferenças do template de confirmação

- **Ícone**: Cadeado ao invés de envelope
- **Título**: "Redefinir sua senha" ao invés de "Confirme seu cadastro"
- **Mensagem**: Texto específico sobre redefinição de senha
- **Botão**: "Redefinir Senha" ao invés de "Confirmar E-mail"
- **Aviso de expiração**: 1 hora ao invés de 24 horas
- **Footer**: Mensagem sobre segurança e contato

