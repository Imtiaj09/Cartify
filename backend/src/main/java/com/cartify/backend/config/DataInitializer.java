package com.cartify.backend.config;

import com.cartify.backend.model.CategoryEntity;
import com.cartify.backend.model.ProductEntity;
import com.cartify.backend.model.UserEntity;
import com.cartify.backend.repository.CategoryRepository;
import com.cartify.backend.repository.ProductRepository;
import com.cartify.backend.repository.UserRepository;
import com.cartify.backend.service.UserAuthSupport;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        UserRepository userRepository,
        UserAuthSupport userAuthSupport
    ) {
        return args -> {
            seedCategories(categoryRepository);
            seedProducts(categoryRepository, productRepository);
            seedAdminUser(userRepository, userAuthSupport);
        };
    }

    private void seedCategories(CategoryRepository categoryRepository) {
        if (categoryRepository.count() > 0) {
            return;
        }

        categoryRepository.saveAll(Arrays.asList(
            buildCategory("Electronics", "bi-laptop"),
            buildCategory("Fashion", "bi-bag"),
            buildCategory("Home", "bi-house"),
            buildCategory("Beauty", "bi-stars"),
            buildCategory("Sports", "bi-bicycle")
        ));
    }

    private CategoryEntity buildCategory(String name, String icon) {
        CategoryEntity category = new CategoryEntity();
        category.setName(name);
        category.setIcon(icon);
        category.setItemCount(0);
        return category;
    }

    private void seedProducts(CategoryRepository categoryRepository, ProductRepository productRepository) {
        if (productRepository.count() > 0) {
            return;
        }

        CategoryEntity electronics = categoryRepository.findByNameIgnoreCase("Electronics").orElse(null);
        CategoryEntity fashion = categoryRepository.findByNameIgnoreCase("Fashion").orElse(null);

        ProductEntity smartphone = new ProductEntity();
        smartphone.setName("Quantum X Smartphone");
        smartphone.setDescription("Flagship 5G phone with pro-grade camera and all-day battery.");
        smartphone.setPrice(new BigDecimal("64900"));
        smartphone.setDiscountedPrice(new BigDecimal("58900"));
        smartphone.setCategory(electronics);
        smartphone.setTags(Arrays.asList("New Arrival", "Trending", "5G"));
        smartphone.setColors(Arrays.asList("#4a4a4a", "#b2d8ff"));
        smartphone.setStock(28);
        smartphone.setHighlighted(true);
        smartphone.setMainImage("https://placehold.co/900x1100/eef5ff/1f2a44?text=Quantum+X+Front");
        smartphone.setImages(Arrays.asList(
            "https://placehold.co/900x1100/eef5ff/1f2a44?text=Quantum+X+Front",
            "https://placehold.co/900x1100/dce8fb/1f2a44?text=Quantum+X+Back"
        ));
        smartphone.setCreatedAt(Instant.parse("2026-02-15T08:30:00Z"));
        smartphone.setRating(5.0);
        smartphone.setReviewCount(182);
        smartphone.setBadge("Hot");
        smartphone.setSalesCount(1200);

        ProductEntity headphones = new ProductEntity();
        headphones.setName("Pulse ANC Headphones");
        headphones.setDescription("Immersive sound with adaptive noise cancellation.");
        headphones.setPrice(new BigDecimal("12400"));
        headphones.setDiscountedPrice(new BigDecimal("10400"));
        headphones.setCategory(electronics);
        headphones.setTags(Arrays.asList("Trending", "Best Seller"));
        headphones.setColors(Arrays.asList("#4a4a4a", "#f5f5dc"));
        headphones.setStock(56);
        headphones.setHighlighted(true);
        headphones.setMainImage("https://placehold.co/900x1100/f6f7fb/2f3438?text=Pulse+ANC");
        headphones.setImages(Collections.singletonList("https://placehold.co/900x1100/f6f7fb/2f3438?text=Pulse+ANC"));
        headphones.setCreatedAt(Instant.parse("2026-02-20T10:00:00Z"));
        headphones.setRating(4.8);
        headphones.setReviewCount(94);
        headphones.setBadge("Sale");
        headphones.setSalesCount(860);

        ProductEntity jacket = new ProductEntity();
        jacket.setName("Classic Bomber Jacket");
        jacket.setDescription("Weather-ready bomber jacket with premium fabric.");
        jacket.setPrice(new BigDecimal("8900"));
        jacket.setDiscountedPrice(null);
        jacket.setCategory(fashion);
        jacket.setTags(Collections.singletonList("Trending"));
        jacket.setColors(Arrays.asList("#4a4a4a", "#aaddbb"));
        jacket.setStock(44);
        jacket.setHighlighted(false);
        jacket.setMainImage("https://placehold.co/900x1100/f7f9fc/3d4348?text=Bomber+Jacket");
        jacket.setImages(Collections.singletonList("https://placehold.co/900x1100/f7f9fc/3d4348?text=Bomber+Jacket"));
        jacket.setCreatedAt(Instant.parse("2026-02-28T05:45:00Z"));
        jacket.setRating(4.4);
        jacket.setReviewCount(41);
        jacket.setBadge(null);
        jacket.setSalesCount(220);

        productRepository.saveAll(List.of(smartphone, headphones, jacket));
        refreshCategoryItemCounts(categoryRepository, productRepository);
    }

    private void refreshCategoryItemCounts(CategoryRepository categoryRepository, ProductRepository productRepository) {
        List<CategoryEntity> categories = categoryRepository.findAll();
        for (CategoryEntity category : categories) {
            long count = productRepository.countByCategoryId(category.getId());
            category.setItemCount((int) count);
        }
        categoryRepository.saveAll(categories);
    }

    private void seedAdminUser(UserRepository userRepository, UserAuthSupport userAuthSupport) {
        long adminCount = userRepository.countByRoleIn(Arrays.asList("Super Admin", "Sub Admin"));
        if (adminCount > 0) {
            return;
        }

        UserEntity admin = new UserEntity();
        admin.setFirstName("System");
        admin.setLastName("Admin");
        admin.setEmail("admin@cartify.dev");
        admin.setRole("Super Admin");
        admin.setStatus("Active");
        admin.setPermissions(userAuthSupport.toPermissionsEmbeddable(null, "Super Admin"));
        admin.setRegistrationDate(Instant.now());
        admin.setPasswordHash(userAuthSupport.hashPassword("admin@cartify.dev", "Admin@123"));
        admin.setAvatarUrl(userAuthSupport.defaultAvatar("System", "Admin"));
        admin.setPhone("");

        userRepository.save(admin);
    }
}
