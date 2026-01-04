# Pull Request: Melhora UI/UX da página de ranking

## Título
`feat: Melhora UI/UX da página de ranking com countdown animado e histórico de campeões`

## 🎯 Objetivo
Melhorar a experiência do usuário na página de ranking com implementação de countdown timer animado, histórico de campeões mensais e ajustes de layout.

## ✨ Funcionalidades Implementadas

### Countdown Timer Animado
- Timer de contagem regressiva animado com transições suaves usando framer-motion
- Exibição de dias, horas, minutos e segundos até o fechamento do mês
- Todos os números em amarelo padronizado do sistema
- Layout responsivo em linha única para mobile
- Card com largura igual ao card das abas dos meses

### Mural de Campeões
- Implementação de abas mensais (Janeiro a Dezembro de 2026)
- Visualização de campeões de meses anteriores
- Nome do mês completo no desktop e abreviado no mobile
- Navegação intuitiva entre os meses
- Tab do mês atual selecionada por padrão

### Lógica de Exibição
- **Dia 1**: Exibe o campeão do mês anterior com XP, nível, foto e troféu
- **Dias 2-31**: Exibe countdown regressivo até o fechamento do mês
- **Mês fechado**: Exibe o campeão daquele mês específico

### Ajustes de UI/UX
- Removidos filtros 'Mensal' e 'Geral', mantendo apenas ranking geral
- Mensagem sobre Hotmart Club atualizada para ser mais explícita
- Melhor distribuição de espaço e organização visual

## 🔧 Alterações Técnicas

### Novos Arquivos
- `src/components/ui/countdown-timer.tsx` - Componente de countdown animado
- `src/app/api/ranking/historico/route.ts` - API endpoint para histórico de campeões

### Arquivos Modificados
- `src/app/aluno/ranking/page.tsx` - Implementação das novas funcionalidades
- `src/app/api/ranking/route.ts` - Atualização de mensagem Hotmart Club
- `src/app/globals.css` - Remoção de animações não utilizadas

## ✅ Testes
- ✅ Build realizado com sucesso
- ✅ Layout responsivo verificado
- ✅ Lógica de datas validada
- ✅ Integração com API testada

## 🔗 URL para Criar PR
https://github.com/dev-vailonge/escolanovaeratech/pull/new/fix/corrige-ui-ranking

