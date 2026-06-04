package com.adega.model;

import com.adega.model.enums.CanalVenda;
import com.adega.model.enums.StatusVenda;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vendas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"itens", "pagamentos"})
@EqualsAndHashCode(exclude = {"itens", "pagamentos"})
public class Venda {

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
    private LocalDateTime dataHora;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusVenda status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CanalVenda canal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalBruto;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalDesconto = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalLiquido;

    @Column(length = 44)
    private String nfeChave;

    @Builder.Default
    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemVenda> itens = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pagamento> pagamentos = new ArrayList<>();
}
