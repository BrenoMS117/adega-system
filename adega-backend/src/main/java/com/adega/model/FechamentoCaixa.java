package com.adega.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "fechamentos_caixa")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FechamentoCaixa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adega_id", nullable = false)
    private Adega adega;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDate data;

    @Column(nullable = false)
    private Integer totalVendas;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalFaturamento;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalDinheiro;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPix;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCartao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalBeneficio;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalDescontos;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dinheiroSistema;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dinheiroContado;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal diferenca;

    @Column(columnDefinition = "TEXT")
    private String observacao;
}
