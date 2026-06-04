package com.adega.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "adegas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Adega {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(length = 500)
    private String endereco;

    @Column(length = 18)
    private String cnpj;
}
