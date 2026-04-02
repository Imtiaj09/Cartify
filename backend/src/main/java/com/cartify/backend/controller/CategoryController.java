package com.cartify.backend.controller;

import com.cartify.backend.dto.CategoryRequest;
import com.cartify.backend.dto.CategoryResponse;
import com.cartify.backend.model.CategoryEntity;
import com.cartify.backend.model.ProductEntity;
import com.cartify.backend.repository.CategoryRepository;
import com.cartify.backend.repository.ProductRepository;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:4200")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryController(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public CategoryResponse getById(@PathVariable Long id) {
        CategoryEntity entity = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        return toResponse(entity);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@RequestBody CategoryRequest request) {
        String name = normalizeName(request.getName());
        categoryRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
        });

        CategoryEntity entity = new CategoryEntity();
        applyRequest(entity, request);
        entity.setName(name);
        return toResponse(categoryRepository.save(entity));
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable Long id, @RequestBody CategoryRequest request) {
        CategoryEntity entity = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        String nextName = normalizeName(request.getName());
        categoryRepository.findByNameIgnoreCase(nextName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
            }
        });

        applyRequest(entity, request);
        entity.setName(nextName);
        return toResponse(categoryRepository.save(entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        CategoryEntity entity = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        List<ProductEntity> products = productRepository.findByCategoryId(id);
        for (ProductEntity product : products) {
            product.setCategory(null);
        }
        productRepository.saveAll(products);
        categoryRepository.delete(entity);
    }

    private void applyRequest(CategoryEntity entity, CategoryRequest request) {
        String icon = request.getIcon() == null ? "bi-tag" : request.getIcon().trim();
        entity.setIcon(icon.isEmpty() ? "bi-tag" : icon);
        entity.setItemCount(request.getItemCount() == null || request.getItemCount() < 0 ? 0 : request.getItemCount());
    }

    private String normalizeName(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
        }

        String lower = normalized.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private CategoryResponse toResponse(CategoryEntity entity) {
        CategoryResponse response = new CategoryResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setIcon(entity.getIcon());
        response.setItemCount(entity.getItemCount());
        return response;
    }
}
