# Integração de Componentes Spline 3D

Os componentes Spline foram integrados com sucesso ao projeto. Esta documentação explica como usar os componentes.

## 📦 Dependências Instaladas

- `@splinetool/runtime` - Runtime do Spline
- `@splinetool/react-spline` - Componente React do Spline
- `clsx` - Utilitário para classes CSS
- `tailwind-merge` - Merge de classes Tailwind
- `framer-motion` - Já estava instalado

## 📁 Estrutura Criada

```
src/
├── components/
│   └── ui/
│       ├── splite.tsx          # Componente SplineScene
│       ├── card.tsx            # Componente Card (shadcn)
│       ├── spotlight.tsx        # Componente Spotlight (aceternity)
│       └── spline-demo.tsx     # Demo completo
├── lib/
│   └── utils.ts                # Função cn() para classes CSS
└── app/
    └── globals.css             # Variáveis CSS e animações
```

## 🚀 Como Usar

### 1. Componente SplineScene Básico

```tsx
import { SplineScene } from "@/components/ui/splite";

export default function MyPage() {
  return (
    <SplineScene 
      scene="https://prod.spline.design/SEU_SCENE_URL/scene.splinecode"
      className="w-full h-[500px]"
    />
  )
}
```

### 2. Demo Completo com Spotlight

```tsx
import { SplineSceneBasic } from "@/components/ui/spline-demo";

export default function MyPage() {
  return <SplineSceneBasic />
}
```

### 3. Card Component (shadcn)

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Título</CardTitle>
      </CardHeader>
      <CardContent>
        Conteúdo do card
      </CardContent>
    </Card>
  )
}
```

### 4. Spotlight Component

```tsx
import { Spotlight } from "@/components/ui/spotlight";

export default function MyComponent() {
  return (
    <div className="relative">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      {/* Seu conteúdo aqui */}
    </div>
  )
}
```

## 📝 Notas Importantes

### Sobre a pasta `/components/ui`

A pasta `/components/ui` é importante porque:
- Segue o padrão do shadcn/ui
- Organiza componentes reutilizáveis
- Facilita a manutenção e escalabilidade
- Permite adicionar mais componentes shadcn no futuro

### Variáveis CSS

As variáveis CSS foram adicionadas em `globals.css` para suportar os componentes Card:
- `--card`: Cor de fundo do card
- `--card-foreground`: Cor do texto do card
- `--muted`: Cor de fundo muted
- `--muted-foreground`: Cor do texto muted

### Animações

A animação `spotlight` foi adicionada ao CSS global e é usada pelo componente Spotlight.

## 🔧 Configuração do Tailwind

O `tailwind.config.js` foi atualizado para incluir as cores do shadcn/ui:
- `card`
- `card-foreground`
- `muted`
- `muted-foreground`

## ⚠️ Avisos

1. **Versão do Next.js**: O projeto usa Next.js 14.1.0, mas `@splinetool/react-spline` requer >= 14.2.0. A instalação foi feita com `--legacy-peer-deps` para contornar isso. Considere atualizar o Next.js no futuro.

2. **URLs do Spline**: Você precisa substituir a URL de exemplo pela URL real da sua cena Spline.

3. **Performance**: Componentes 3D podem ser pesados. Considere usar lazy loading (já implementado) e otimizar as cenas.

## 📚 Recursos

- [Documentação do Spline](https://spline.design/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)

