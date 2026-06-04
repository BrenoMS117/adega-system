package com.adega.service;

import com.adega.dto.request.CategoriaRequest;
import com.adega.dto.response.CategoriaResponse;
import com.adega.exception.BusinessException;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.Categoria;
import com.adega.repository.CategoriaRepository;
import com.adega.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;

    @Transactional(readOnly = true)
    public List<CategoriaResponse> findAll() {
        return categoriaRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CategoriaResponse create(CategoriaRequest request) {
        validateNomeUnico(request.nome(), null);
        Categoria categoria = Categoria.builder()
                .nome(request.nome())
                .build();
        return toResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponse update(UUID id, CategoriaRequest request) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        validateNomeUnico(request.nome(), id);
        categoria.setNome(request.nome());
        return toResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public void delete(UUID id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (produtoRepository.countByCategoriaId(id) > 0) {
            throw new BusinessException("Categoria possui produtos vinculados e não pode ser removida");
        }
        categoriaRepository.delete(categoria);
    }

    private void validateNomeUnico(String nome, UUID idAtual) {
        categoriaRepository.findByNome(nome).ifPresent(existente -> {
            if (!existente.getId().equals(idAtual)) {
                throw new BusinessException("Já existe uma categoria com este nome");
            }
        });
    }

    private CategoriaResponse toResponse(Categoria categoria) {
        int totalProdutos = (int) produtoRepository.countByCategoriaId(categoria.getId());
        return new CategoriaResponse(categoria.getId(), categoria.getNome(), totalProdutos);
    }
}
