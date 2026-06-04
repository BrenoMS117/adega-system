package com.adega.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "itens_venda")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "venda")
@EqualsAndHashCode(exclude = "venda")
public class ItemVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venda_id", nullable = false)
    private Venda venda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variacao_produto_id", nullable = false)
    private VariacaoProduto variacaoProduto;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    // Cost of acquisition captured at sale time (null for sales made before this column existed).
    @Column(name = "custo_unitario", precision = 10, scale = 2)
    private BigDecimal custoUnitario;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal descontoValor = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
}
