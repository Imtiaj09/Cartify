package com.cartify.backend.repository;

import com.cartify.backend.model.UserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, String> {

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    long countByRoleIn(Iterable<String> roles);
}
