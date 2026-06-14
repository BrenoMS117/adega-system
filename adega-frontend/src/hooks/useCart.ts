import { useState, useEffect } from 'react'
import type { VariacaoProduto } from '../types'

export type CartItem = {
  variacaoId: string
  produtoNome: string
  variacaoDescricao: string
  precoUnitario: number
  quantidade: number
  descontoValor: number
}

const CART_KEY = 'adega_cart'

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  const addToCart = (variacao: VariacaoProduto, produtoNome: string, quantidade = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variacaoId === variacao.id)
      if (existing) {
        return prev.map((i) =>
          i.variacaoId === variacao.id ? { ...i, quantidade: i.quantidade + quantidade } : i,
        )
      }
      return [
        ...prev,
        {
          variacaoId: variacao.id,
          produtoNome,
          variacaoDescricao: variacao.descricao,
          precoUnitario: variacao.precoVenda,
          quantidade,
          descontoValor: 0,
        },
      ]
    })
  }

  const updateQuantidade = (variacaoId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.variacaoId === variacaoId ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0),
    )
  }

  const setQuantidade = (variacaoId: string, quantidade: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.variacaoId === variacaoId ? { ...i, quantidade } : i))
        .filter((i) => i.quantidade > 0),
    )
  }

  const updateDesconto = (variacaoId: string, valor: number) => {
    setCart((prev) =>
      prev.map((i) => (i.variacaoId === variacaoId ? { ...i, descontoValor: valor } : i)),
    )
  }

  const removeItem = (variacaoId: string) => {
    setCart((prev) => prev.filter((i) => i.variacaoId !== variacaoId))
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem(CART_KEY)
  }

  const totalBruto = cart.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0)
  const totalDesconto = cart.reduce((sum, i) => sum + (i.descontoValor || 0), 0)
  const totalLiquido = totalBruto - totalDesconto

  return {
    cart,
    addToCart,
    updateQuantidade,
    setQuantidade,
    updateDesconto,
    removeItem,
    clearCart,
    totalBruto,
    totalDesconto,
    totalLiquido,
  }
}
