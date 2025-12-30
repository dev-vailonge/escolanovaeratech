# 📚 Guia Completo: Fluxo de Trabalho com Git e Pull Requests

## 🎯 Objetivo

Este guia explica passo a passo como trabalhar com Git e Pull Requests (PRs) no projeto, desde criar uma branch até fazer merge na main.

---

## 🔄 Fluxo Completo de Trabalho

### 1️⃣ **Criar uma Nova Branch**

Sempre que for fazer uma mudança, crie uma branch nova:

```bash
# Verificar em qual branch você está
git branch

# Verificar se há mudanças não commitadas
git status

# Criar e mudar para nova branch
git checkout -b fix/nome-do-problema

# OU se preferir usar o padrão de nomenclatura:
git checkout -b feature/nova-funcionalidade
git checkout -b fix/corrige-bug-login
```

**📝 Dica:** Use o guia de nomenclatura em `docs/GUIA_NOMENCLATURA_BRANCHES.md`

---

### 2️⃣ **Fazer Mudanças e Commits**

```bash
# 1. Fazer suas mudanças no código

# 2. Ver o que mudou
git status

# 3. Adicionar arquivos modificados
git add src/app/aluno/login/page.tsx
# OU adicionar todos os arquivos modificados:
git add .

# 4. Fazer commit com mensagem descritiva
git commit -m "fix: corrige problema de login em produção"

# 5. Continuar fazendo commits conforme necessário
git add src/middleware.ts
git commit -m "fix: adiciona fallback no middleware para cookies"
```

**📝 Boas Práticas:**
- Faça commits pequenos e frequentes
- Mensagens claras: `fix:`, `feat:`, `docs:`, etc.
- Um commit = uma mudança lógica

---

### 3️⃣ **Enviar Branch para GitHub (Push)**

```bash
# Enviar branch para GitHub (primeira vez)
git push origin fix/nome-do-problema

# Se a branch já existe no GitHub, apenas:
git push
```

**⚠️ Importante:** 
- Sempre faça push da branch ANTES de criar o PR
- O GitHub precisa da branch no repositório remoto

---

### 4️⃣ **Criar Pull Request (PR)**

#### Opção A: Via Link Direto (Mais Fácil)

1. Após fazer push, o Git mostra um link:
   ```
   remote: Create a pull request for 'fix/nome' on GitHub by visiting:
   remote:      https://github.com/dev-vailonge/escolanovaeratech/pull/new/fix/nome
   ```
2. Clique no link ou copie e cole no navegador
3. Preencha título e descrição
4. Clique em "Create pull request"

#### Opção B: Via GitHub Website

1. Acesse: https://github.com/dev-vailonge/escolanovaeratech
2. Clique em "Pull requests" (aba no topo)
3. Clique em "New pull request" (botão verde)
4. Selecione:
   - **Base:** `main` (ou `master`)
   - **Compare:** `fix/nome-do-problema` (sua branch)
5. Preencha título e descrição
6. Clique em "Create pull request"

#### Opção C: Via Link de Comparação

1. Acesse: https://github.com/dev-vailonge/escolanovaeratech/compare
2. Selecione:
   - **Base:** `main`
   - **Compare:** `fix/nome-do-problema`
3. Clique em "Create pull request"

---

### 5️⃣ **Preencher o PR**

#### Título (Obrigatório)
```
fix: corrige login na rota /aluno em produção
```

#### Descrição (Recomendado)
```markdown
## 🔧 O que foi feito?

Corrige problema onde login não funciona em produção na rota `/aluno`.

## 🐛 Problema

- Login funciona em desenvolvimento
- Login não funciona em produção
- Middleware não encontra cookies após login

## ✅ Solução

- Cria rota `/api/aluno/auth-callback` para criar cookies
- Middleware permite acesso com cookies (fallback)
- Logs detalhados para debug

## 🧪 Como Testar

1. Fazer login em produção
2. Verificar se cookies aparecem no Application/Cookies
3. Verificar se redirect funciona
```

---

### 6️⃣ **Aguardar Review e Aprovação**

1. **Solicitar Review:**
   - No PR, clique em "Reviewers"
   - Adicione o Roque (ou gestor do projeto)
   - Aguarde aprovação

2. **Verificar Status:**
   - ✅ Checks passando (verde) = código OK
   - ⏳ Checks rodando (amarelo) = aguardando
   - ❌ Checks falhando (vermelho) = precisa corrigir

3. **Aguardar Aprovação:**
   - PR precisa de aprovação antes de fazer merge
   - Não faça merge sem aprovação!

---

### 7️⃣ **Fazer Merge (Após Aprovação)**

**⚠️ IMPORTANTE:** Só faça merge se:
- ✅ PR foi aprovado
- ✅ Todos os checks estão passando (verde)
- ✅ Você tem permissão para fazer merge

#### Como Fazer Merge:

1. No PR, role até o final
2. Clique em "Merge pull request" (botão verde)
3. Escolha tipo de merge:
   - **"Create a merge commit"** (recomendado)
   - "Squash and merge" (combina commits)
   - "Rebase and merge" (histórico linear)
4. Clique em "Confirm merge"
5. Opcional: Delete branch após merge

---

### 8️⃣ **Atualizar Local Após Merge**

```bash
# Voltar para main
git checkout main

# Atualizar main local com mudanças do GitHub
git pull origin main

# Deletar branch local (opcional, já foi mergeada)
git branch -d fix/nome-do-problema
```

---

## 🔍 Comandos Úteis do Dia a Dia

### Ver Status
```bash
# Ver status atual
git status

# Ver diferenças não commitadas
git diff

# Ver histórico de commits
git log --oneline -10
```

### Trabalhar com Branches
```bash
# Ver todas as branches
git branch -a

# Mudar de branch
git checkout nome-da-branch

# Criar nova branch
git checkout -b nova-branch

# Deletar branch local
git branch -d nome-da-branch
```

### Desfazer Mudanças
```bash
# Descartar mudanças não commitadas em um arquivo
git checkout -- arquivo.ts

# Descartar todas as mudanças não commitadas
git checkout .

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer último commit (remove mudanças)
git reset --hard HEAD~1
```

### Sincronizar com GitHub
```bash
# Ver commits que estão no GitHub mas não localmente
git fetch origin

# Ver diferenças entre local e remoto
git log HEAD..origin/main

# Atualizar branch local
git pull origin main
```

---

## 🚨 Situações Comuns e Soluções

### "Preciso atualizar minha branch com mudanças da main"

```bash
# 1. Salvar suas mudanças (se houver)
git stash

# 2. Mudar para main e atualizar
git checkout main
git pull origin main

# 3. Voltar para sua branch
git checkout fix/sua-branch

# 4. Fazer merge da main na sua branch
git merge main

# 5. Resolver conflitos (se houver)
# 6. Fazer push
git push
```

### "Fiz commit errado, preciso corrigir"

```bash
# Se ainda não fez push:
git commit --amend -m "nova mensagem correta"

# Se já fez push:
git commit --amend -m "nova mensagem correta"
git push --force-with-lease
```

### "Preciso adicionar mais mudanças no PR"

```bash
# 1. Fazer mudanças
# 2. Adicionar e commitar
git add .
git commit -m "fix: adiciona mais correções"

# 3. Fazer push (PR atualiza automaticamente)
git push
```

---

## 📋 Checklist Antes de Criar PR

- [ ] Branch criada com nome descritivo
- [ ] Mudanças testadas localmente
- [ ] Commits com mensagens claras
- [ ] Branch enviada para GitHub (`git push`)
- [ ] PR criado com título e descrição
- [ ] Reviewers adicionados
- [ ] Aguardando aprovação

---

## 📋 Checklist Antes de Fazer Merge

- [ ] PR foi aprovado
- [ ] Todos os checks estão passando (verde)
- [ ] Código revisado
- [ ] Testado (se possível)
- [ ] Conflitos resolvidos (se houver)
- [ ] Tem permissão para fazer merge

---

## 🎓 Conceitos Importantes

### Branch
- Cópia do código onde você trabalha
- Permite trabalhar sem afetar a main
- Exemplo: `fix/login`, `feature/nova-funcionalidade`

### Commit
- Snapshot das mudanças
- Deve ter mensagem descritiva
- Exemplo: `fix: corrige problema de login`

### Pull Request (PR)
- Solicitação para incluir mudanças na main
- Permite review antes de fazer merge
- Facilita discussão sobre mudanças

### Merge
- Incluir mudanças de uma branch na main
- Só fazer após aprovação
- Pode ser feito via GitHub ou Git

---

## 🔗 Links Úteis

- **Repositório:** https://github.com/dev-vailonge/escolanovaeratech
- **Branches:** https://github.com/dev-vailonge/escolanovaeratech/branches
- **Pull Requests:** https://github.com/dev-vailonge/escolanovaeratech/pulls
- **Criar PR:** https://github.com/dev-vailonge/escolanovaeratech/compare

---

## 💡 Dicas Finais

1. **Sempre crie branch nova** para cada mudança
2. **Faça commits frequentes** (não acumule muito)
3. **Mensagens claras** nos commits
4. **Sempre faça push** antes de criar PR
5. **Nunca faça merge** sem aprovação
6. **Mantenha main atualizada** localmente
7. **Peça ajuda** quando tiver dúvidas!

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas sobre:
- Como criar branch → Veja seção 1
- Como fazer commit → Veja seção 2
- Como criar PR → Veja seção 4
- Como fazer merge → Veja seção 7
- Comandos Git → Veja seção "Comandos Úteis"

**Lembre-se:** É normal ter dúvidas no início. Com prática, fica automático! 🚀

