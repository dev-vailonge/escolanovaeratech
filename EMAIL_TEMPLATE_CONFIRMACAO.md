# Template de Email de Confirmação - Nova Era Tech

Template HTML para email de confirmação de conta usando as cores do design system (Amarelo #facc15 e Preto #000000).

## Código para copiar no Supabase Auth Email Template

Cole o código abaixo no campo "Body" (aba Source) da configuração "Confirm sign up" no Supabase Dashboard.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu cadastro - Nova Era Tech</title>
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
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #facc15; letter-spacing: -0.5px;">
                Nova Era Tech
              </h1>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color: #18181b; border-radius: 12px; padding: 48px 32px; border: 1px solid rgba(250, 204, 21, 0.2);">
              
              <!-- Ícone de email -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="width: 80px; height: 80px; background-color: rgba(250, 204, 21, 0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 2px solid rgba(250, 204, 21, 0.3);">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
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
                      Confirme seu cadastro
                    </h2>
                  </td>
                </tr>
              </table>

              <!-- Mensagem -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #9ca3af;">
                      Olá! Estamos muito felizes em tê-lo(a) conosco. Para completar seu cadastro e começar sua jornada na Nova Era Tech, confirme seu endereço de e-mail clicando no botão abaixo.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Botão de confirmação -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background-color: #facc15; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(250, 204, 21, 0.3);">
                      Confirmar E-mail
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
                      Este link expira em 24 horas. Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.
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
                Se tiver alguma dúvida, entre em contato conosco.
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

- `{{ .ConfirmationURL }}` - URL de confirmação (obrigatório)
- `{{ .Email }}` - Email do usuário
- `{{ .SiteURL }}` - URL do site
- `{{ .Token }}` - Token de confirmação
- `{{ .RedirectTo }}` - URL de redirecionamento

## Preview

O template é responsivo e funciona bem na maioria dos clientes de email. Use a aba "Preview" no Supabase para visualizar antes de salvar.
