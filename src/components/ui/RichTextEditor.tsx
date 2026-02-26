'use client'

import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite aqui...',
  className,
  minHeight = '80px',
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || ''
    }
  }, [value])

  const emit = useCallback(() => {
    const html = ref.current?.innerHTML ?? ''
    onChange(html)
  }, [onChange])

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    ref.current?.focus()
    emit()
  }

  return (
    <div className={cn('rounded border overflow-hidden', className)}>
      <div className="flex items-center gap-0.5 p-1 border-b bg-black/20">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white"
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white"
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white"
          title="Lista com marcadores"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white"
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        className="w-full px-2 py-1.5 text-sm outline-none focus:ring-0 min-h-[80px] [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-gray-500 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside"
        style={{ minHeight }}
        suppressContentEditableWarning
      />
    </div>
  )
}
