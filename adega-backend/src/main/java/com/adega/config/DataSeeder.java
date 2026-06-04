package com.adega.config;

import com.adega.model.*;
import com.adega.model.enums.PerfilUsuario;
import com.adega.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final AdegaRepository adegaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() > 0) return;

        log.info("Seeding initial data...");

        Adega adegaCentral = adegaRepository.save(Adega.builder()
                .nome("Adega Central")
                .endereco("Rua das Flores 100")
                .cnpj("11.111.111/0001-11")
                .build());

        Adega adegaNorte = adegaRepository.save(Adega.builder()
                .nome("Adega Norte")
                .endereco("Av. Principal 200")
                .cnpj("22.222.222/0001-22")
                .build());

        String senhaHash = passwordEncoder.encode("123456");

        usuarioRepository.saveAll(List.of(
                buildUsuario("Roberto", "roberto@adega.com", senhaHash, PerfilUsuario.DONO, null),
                buildUsuario("Marcos", "marcos@adega.com", senhaHash, PerfilUsuario.DONO, null),
                buildUsuario("Carlos", "carlos@adega.com", senhaHash, PerfilUsuario.FUNCIONARIO, adegaCentral),
                buildUsuario("Ana", "ana@adega.com", senhaHash, PerfilUsuario.FUNCIONARIO, adegaCentral),
                buildUsuario("Pedro", "pedro@adega.com", senhaHash, PerfilUsuario.FUNCIONARIO, adegaNorte)
        ));

        Categoria bebidas = categoriaRepository.save(Categoria.builder().nome("Bebidas").build());
        categoriaRepository.save(Categoria.builder().nome("Doces").build());
        Categoria salgados = categoriaRepository.save(Categoria.builder().nome("Salgados").build());
        Categoria carvao = categoriaRepository.save(Categoria.builder().nome("Carvão").build());
        categoriaRepository.save(Categoria.builder().nome("Narguilé").build());

        seedProduto("Heineken", bebidas,
                new VarSeed("Unidade",    10.00,  4.80, 50, 12),
                new VarSeed("Caixa 24un", 85.00, 68.00, 10,  3));

        seedProduto("Skol 350ml", bebidas,
                new VarSeed("Unidade",    6.00,  2.50, 80, 24),
                new VarSeed("Fardo 12un", 60.00, 28.00, 15,  5));

        seedProduto("Vodka Smirnoff", bebidas,
                new VarSeed("Garrafa", 45.00, 28.00, 4, 6));

        seedProduto("Carvão 5kg", carvao,
                new VarSeed("Unidade", 22.00, 14.00, 5, 8));

        seedProduto("Amendoim", salgados,
                new VarSeed("Pacote", 8.00, 4.50, 22, 10));

        log.info("Seed completed: 2 adegas, 5 usuarios, 5 categorias, 5 produtos.");
    }

    private record VarSeed(String descricao, double preco, double custo, int estoque, int min) {}

    private void seedProduto(String nome, Categoria categoria, VarSeed... vars) {
        Produto produto = Produto.builder()
                .nome(nome)
                .categoria(categoria)
                .ativo(true)
                .build();

        for (VarSeed v : vars) {
            produto.getVariacoes().add(VariacaoProduto.builder()
                    .produto(produto)
                    .descricao(v.descricao())
                    .precoVenda(BigDecimal.valueOf(v.preco()))
                    .custoAquisicao(BigDecimal.valueOf(v.custo()))
                    .estoqueAtual(v.estoque())
                    .estoqueMinimo(v.min())
                    .build());
        }

        produtoRepository.save(produto);
    }

    private Usuario buildUsuario(String nome, String email, String senhaHash,
                                  PerfilUsuario perfil, Adega adega) {
        return Usuario.builder()
                .nome(nome)
                .email(email)
                .senhaHash(senhaHash)
                .perfil(perfil)
                .adega(adega)
                .ativo(true)
                .build();
    }
}
