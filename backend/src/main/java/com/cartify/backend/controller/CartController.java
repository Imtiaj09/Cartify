package com.cartify.backend.controller;

import com.cartify.backend.dto.CartItemRequest;
import com.cartify.backend.dto.CartItemResponse;
import com.cartify.backend.dto.ProductResponse;
import com.cartify.backend.model.CartItemEntity;
import com.cartify.backend.model.ProductEntity;
import com.cartify.backend.repository.CartItemRepository;
import com.cartify.backend.repository.ProductRepository;
import java.time.Instant;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:4200")
public class CartController {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartController(CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/{userId}")
    public List<CartItemResponse> getCart(@PathVariable String userId) {
        return cartItemRepository.findByUserIdOrderByIdDesc(safe(userId)).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @PostMapping("/{userId}/items")
    public List<CartItemResponse> addItem(@PathVariable String userId, @RequestBody CartItemRequest request) {
        String normalizedUserId = safe(userId);
        Long productId = request.getProductId();

        if (normalizedUserId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }

        if (productId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }

        ProductEntity product = productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        int quantity = request.getQuantity() == null || request.getQuantity() < 1 ? 1 : request.getQuantity();
        String selectedColor = safe(request.getSelectedColor());

        CartItemEntity item = cartItemRepository
            .findByUserIdAndProductIdAndSelectedColor(normalizedUserId, productId, selectedColor)
            .orElseGet(() -> {
                CartItemEntity entity = new CartItemEntity();
                entity.setUserId(normalizedUserId);
                entity.setProduct(product);
                entity.setSelectedColor(selectedColor);
                entity.setQuantity(0);
                return entity;
            });

        item.setProduct(product);
        item.setQuantity(item.getQuantity() + quantity);
        cartItemRepository.save(item);
        return getCart(normalizedUserId);
    }

    @PutMapping("/{userId}/items")
    public List<CartItemResponse> updateItemQuantity(@PathVariable String userId, @RequestBody CartItemRequest request) {
        String normalizedUserId = safe(userId);
        Long productId = request.getProductId();
        String selectedColor = safe(request.getSelectedColor());

        if (productId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }

        CartItemEntity existing = cartItemRepository
            .findByUserIdAndProductIdAndSelectedColor(normalizedUserId, productId, selectedColor)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));

        int quantity = request.getQuantity() == null ? existing.getQuantity() : request.getQuantity();
        if (quantity <= 0) {
            cartItemRepository.delete(existing);
        } else {
            existing.setQuantity(quantity);
            cartItemRepository.save(existing);
        }

        return getCart(normalizedUserId);
    }

    @DeleteMapping("/{userId}/items")
    public List<CartItemResponse> removeItem(
        @PathVariable String userId,
        @RequestParam("productId") Long productId,
        @RequestParam(value = "selectedColor", required = false) String selectedColor
    ) {
        cartItemRepository.deleteByUserIdAndProductIdAndSelectedColor(safe(userId), productId, safe(selectedColor));
        return getCart(userId);
    }

    @DeleteMapping("/{userId}/items/all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(@PathVariable String userId) {
        cartItemRepository.deleteByUserId(safe(userId));
    }

    private CartItemResponse toResponse(CartItemEntity item) {
        CartItemResponse response = new CartItemResponse();
        response.setProduct(toProductResponse(item.getProduct()));
        response.setQuantity(item.getQuantity());
        response.setSelectedColor(item.getSelectedColor());
        return response;
    }

    private ProductResponse toProductResponse(ProductEntity entity) {
        ProductResponse response = new ProductResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        response.setPrice(entity.getPrice());
        response.setDiscountedPrice(entity.getDiscountedPrice());
        response.setCategory(entity.getCategory() == null ? "General" : entity.getCategory().getName());
        response.setTags(entity.getTags());
        response.setColors(entity.getColors());
        response.setStock(entity.getStock());
        response.setHighlighted(entity.isHighlighted());
        response.setMainImage(entity.getMainImage());
        response.setImages(entity.getImages());
        response.setCreatedAt(entity.getCreatedAt() == null ? Instant.now().toString() : entity.getCreatedAt().toString());
        response.setRating(entity.getRating());
        response.setReviewCount(entity.getReviewCount());
        response.setBadge(entity.getBadge());
        response.setSalesCount(entity.getSalesCount());
        return response;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
