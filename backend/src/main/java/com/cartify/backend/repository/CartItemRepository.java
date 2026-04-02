package com.cartify.backend.repository;

import com.cartify.backend.model.CartItemEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {

    List<CartItemEntity> findByUserIdOrderByIdDesc(String userId);

    Optional<CartItemEntity> findByUserIdAndProductIdAndSelectedColor(String userId, Long productId, String selectedColor);

    @Transactional
    void deleteByUserId(String userId);

    @Transactional
    void deleteByUserIdAndProductIdAndSelectedColor(String userId, Long productId, String selectedColor);
}
