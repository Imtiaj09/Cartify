package com.cartify.backend.repository;

import com.cartify.backend.model.ProductEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    List<ProductEntity> findByHighlightedTrue();

    long countByCategoryId(Long categoryId);

    List<ProductEntity> findByCategoryId(Long categoryId);
}
