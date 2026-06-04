package com.adega.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "variacoes_produto")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "produto")
@EqualsAndHashCode(exclude = "produto")
public class VariacaoProduto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precoVenda;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal custoAquisicao;

    @Builder.Default
    @Column(nullable = false)
    private Integer estoqueAtual = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer estoqueMinimo = 0;
}
