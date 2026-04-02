package com.cartify.backend.repository;

import com.cartify.backend.model.OrderEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {

    List<OrderEntity> findByUserIdOrderByDateDesc(String userId);
}
