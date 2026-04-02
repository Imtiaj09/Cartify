package com.cartify.backend.service;

import com.cartify.backend.dto.AdminPermissionsDto;
import com.cartify.backend.dto.UserResponse;
import com.cartify.backend.model.AdminPermissionsEmbeddable;
import com.cartify.backend.model.UserEntity;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UserAuthSupport {

    private static final long TOKEN_TTL_SECONDS = 8L * 60L * 60L;

    public String hashPassword(String email, String password) {
        String source = safe(email).toLowerCase() + "::" + safe(password);
        long hash = 2166136261L;

        for (int i = 0; i < source.length(); i += 1) {
            hash ^= source.charAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }

        long normalized = hash & 0xffffffffL;
        return "fnv1a_" + Long.toHexString(normalized);
    }

    public String issueToken(UserEntity user) {
        long now = Instant.now().getEpochSecond();
        String tokenPayload = user.getId()
            + ":" + safe(user.getEmail())
            + ":" + safe(user.getRole())
            + ":" + now
            + ":" + (now + TOKEN_TTL_SECONDS)
            + ":" + UUID.randomUUID();

        return Base64.getUrlEncoder().withoutPadding().encodeToString(
            tokenPayload.getBytes(StandardCharsets.UTF_8)
        );
    }

    public UserResponse toUserResponse(UserEntity entity, String token) {
        UserResponse response = new UserResponse();
        response.setId(entity.getId());
        response.setFirstName(entity.getFirstName());
        response.setLastName(entity.getLastName());
        response.setEmail(entity.getEmail());
        response.setStatus(entity.getStatus());
        response.setRole(entity.getRole());
        response.setPermissions(toPermissionsDto(entity.getPermissions(), entity.getRole()));
        response.setRegistrationDate(entity.getRegistrationDate() == null ? Instant.now().toString() : entity.getRegistrationDate().toString());
        response.setToken(token == null ? "" : token);
        response.setPhone(entity.getPhone());
        response.setAvatarUrl(entity.getAvatarUrl());
        return response;
    }

    public AdminPermissionsEmbeddable toPermissionsEmbeddable(AdminPermissionsDto dto, String role) {
        AdminPermissionsEmbeddable permissions = new AdminPermissionsEmbeddable();

        if ("Super Admin".equals(role)) {
            permissions.setManageProducts(true);
            permissions.setManageOrders(true);
            permissions.setManageUsers(true);
            permissions.setViewReports(true);
            return permissions;
        }

        if (!"Sub Admin".equals(role)) {
            permissions.setManageProducts(false);
            permissions.setManageOrders(false);
            permissions.setManageUsers(false);
            permissions.setViewReports(false);
            return permissions;
        }

        permissions.setManageProducts(dto != null && dto.isManageProducts());
        permissions.setManageOrders(dto != null && dto.isManageOrders());
        permissions.setManageUsers(dto != null && dto.isManageUsers());
        permissions.setViewReports(dto != null && dto.isViewReports());
        return permissions;
    }

    public AdminPermissionsDto toPermissionsDto(AdminPermissionsEmbeddable permissions, String role) {
        AdminPermissionsDto dto = new AdminPermissionsDto();

        if ("Super Admin".equals(role)) {
            dto.setManageProducts(true);
            dto.setManageOrders(true);
            dto.setManageUsers(true);
            dto.setViewReports(true);
            return dto;
        }

        dto.setManageProducts(permissions != null && permissions.isManageProducts());
        dto.setManageOrders(permissions != null && permissions.isManageOrders());
        dto.setManageUsers(permissions != null && permissions.isManageUsers());
        dto.setViewReports(permissions != null && permissions.isViewReports());
        return dto;
    }

    public String normalizeRole(String rawRole) {
        if ("Super Admin".equals(rawRole) || "Sub Admin".equals(rawRole) || "Customer".equals(rawRole)) {
            return rawRole;
        }

        if ("ADMIN".equalsIgnoreCase(rawRole)) {
            return "Super Admin";
        }

        return "Customer";
    }

    public String normalizeStatus(String rawStatus) {
        return "Suspended".equals(rawStatus) ? "Suspended" : "Active";
    }

    public String defaultAvatar(String firstName, String lastName) {
        String safeFirst = safe(firstName).isEmpty() ? "User" : safe(firstName);
        String safeLast = safe(lastName).isEmpty() ? "Account" : safe(lastName);
        return "https://ui-avatars.com/api/?name=" + safeFirst + "+" + safeLast + "&background=20a04b&color=fff";
    }

    public String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
