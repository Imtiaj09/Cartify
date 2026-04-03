package com.cartify.backend.controller;

import com.cartify.backend.dto.ProductRequest;
import com.cartify.backend.dto.ProductResponse;
import com.cartify.backend.model.CategoryEntity;
import com.cartify.backend.model.ProductEntity;
import com.cartify.backend.repository.CategoryRepository;
import com.cartify.backend.repository.ProductRepository;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
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
@RequestMapping("/api/products")
@CrossOrigin(originPatterns = {
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://0.0.0.0:*",
    "https://localhost:*",
    "https://127.0.0.1:*",
    "https://0.0.0.0:*"
})
@Transactional
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductController(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<ProductResponse> getAll() {
        return productRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @GetMapping("/highlighted")
    public List<ProductResponse> getHighlighted() {
        return productRepository.findByHighlightedTrue().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        ProductEntity entity = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return toResponse(entity);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@RequestBody ProductRequest request) {
        ProductEntity entity = new ProductEntity();
        applyRequest(entity, request);
        ProductResponse response = toResponse(productRepository.save(entity));
        refreshCategoryItemCounts();
        return response;
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @RequestBody ProductRequest request) {
        ProductEntity entity = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        applyRequest(entity, request);
        ProductResponse response = toResponse(productRepository.save(entity));
        refreshCategoryItemCounts();
        return response;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        productRepository.deleteById(id);
        refreshCategoryItemCounts();
    }

    private void applyRequest(ProductEntity entity, ProductRequest request) {
        String name = sanitizeRequired(request.getName(), "Product name is required");
        String description = sanitizeRequired(request.getDescription(), "Product description is required");

        entity.setName(name);
        entity.setDescription(description);
        entity.setPrice(request.getPrice() == null ? java.math.BigDecimal.ZERO : request.getPrice());
        entity.setDiscountedPrice(request.getDiscountedPrice());
        entity.setCategory(resolveCategory(request.getCategory()));
        entity.setTags(copyList(request.getTags()));
        entity.setColors(copyList(request.getColors()));
        entity.setStock(request.getStock() == null || request.getStock() < 0 ? 0 : request.getStock());
        entity.setHighlighted(Boolean.TRUE.equals(request.getHighlighted()));
        entity.setMainImage(sanitizeOptional(request.getMainImage()));
        entity.setImages(copyList(request.getImages()));
        entity.setCreatedAt(parseInstant(request.getCreatedAt(), entity.getCreatedAt()));
        entity.setRating(request.getRating());
        entity.setReviewCount(request.getReviewCount());
        entity.setBadge(sanitizeOptional(request.getBadge()));
        entity.setSalesCount(request.getSalesCount());

        if (entity.getMainImage().isEmpty() && !entity.getImages().isEmpty()) {
            entity.setMainImage(entity.getImages().get(0));
        }

        if (entity.getMainImage().isEmpty()) {
            entity.setMainImage("https://placehold.co/900x1100/f2f5f8/2f3438?text=Product");
        }

        if (entity.getImages().isEmpty()) {
            entity.setImages(Collections.singletonList(entity.getMainImage()));
        }
    }

    private CategoryEntity resolveCategory(String categoryName) {
        String normalized = sanitizeOptional(categoryName);

        if (normalized.isEmpty()) {
            return null;
        }

        return categoryRepository.findByNameIgnoreCase(normalized)
            .orElseGet(() -> {
                CategoryEntity category = new CategoryEntity();
                category.setName(normalized);
                category.setIcon("bi-tag");
                category.setItemCount(0);
                return categoryRepository.save(category);
            });
    }

    private ProductResponse toResponse(ProductEntity entity) {
        ProductResponse response = new ProductResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        response.setPrice(entity.getPrice());
        response.setDiscountedPrice(entity.getDiscountedPrice());
        response.setCategory(entity.getCategory() == null ? "General" : entity.getCategory().getName());
        response.setTags(copyList(entity.getTags()));
        response.setColors(copyList(entity.getColors()));
        response.setStock(entity.getStock());
        response.setHighlighted(entity.isHighlighted());
        response.setMainImage(entity.getMainImage());
        response.setImages(copyList(entity.getImages()));
        response.setCreatedAt(entity.getCreatedAt() == null ? Instant.now().toString() : entity.getCreatedAt().toString());
        response.setRating(entity.getRating());
        response.setReviewCount(entity.getReviewCount());
        response.setBadge(entity.getBadge());
        response.setSalesCount(entity.getSalesCount());
        return response;
    }

    private String sanitizeRequired(String value, String errorMessage) {
        String normalized = sanitizeOptional(value);
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return normalized;
    }

    private String sanitizeOptional(String value) {
        return value == null ? "" : value.trim();
    }

    private Instant parseInstant(String value, Instant fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback == null ? Instant.now() : fallback;
        }

        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            return fallback == null ? Instant.now() : fallback;
        }
    }

    private List<String> copyList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }

        return values.stream()
            .map(this::sanitizeOptional)
            .filter(value -> !value.isEmpty())
            .collect(Collectors.toList());
    }

    private void refreshCategoryItemCounts() {
        List<CategoryEntity> categories = categoryRepository.findAll();
        for (CategoryEntity category : categories) {
            long count = productRepository.countByCategoryId(category.getId());
            category.setItemCount((int) count);
        }
        categoryRepository.saveAll(categories);
    }
}
