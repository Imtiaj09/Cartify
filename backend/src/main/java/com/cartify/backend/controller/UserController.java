package com.cartify.backend.controller;

import com.cartify.backend.dto.PasswordChangeRequest;
import com.cartify.backend.dto.UserRequest;
import com.cartify.backend.dto.UserResponse;
import com.cartify.backend.dto.UserStatusUpdateRequest;
import com.cartify.backend.model.UserEntity;
import com.cartify.backend.repository.UserRepository;
import com.cartify.backend.service.UserAuthSupport;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(originPatterns = {
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://0.0.0.0:*",
    "https://localhost:*",
    "https://127.0.0.1:*",
    "https://0.0.0.0:*"
})
public class UserController {

    private final UserRepository userRepository;
    private final UserAuthSupport userAuthSupport;

    public UserController(UserRepository userRepository, UserAuthSupport userAuthSupport) {
        this.userRepository = userRepository;
        this.userAuthSupport = userAuthSupport;
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
            .map(user -> userAuthSupport.toUserResponse(user, ""))
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable String id) {
        UserEntity user = findUser(id);
        return userAuthSupport.toUserResponse(user, "");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@RequestBody UserRequest request) {
        String firstName = userAuthSupport.safe(request.getFirstName());
        String lastName = userAuthSupport.safe(request.getLastName());
        String email = userAuthSupport.safe(request.getEmail()).toLowerCase();
        String password = userAuthSupport.safe(request.getPassword());

        if (firstName.isEmpty() || email.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name and email are required.");
        }

        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered.");
        });

        UserEntity entity = new UserEntity();
        entity.setFirstName(firstName);
        entity.setLastName(lastName.isEmpty() ? "User" : lastName);
        entity.setEmail(email);
        String role = userAuthSupport.normalizeRole(request.getRole());
        entity.setRole(role);
        entity.setStatus(userAuthSupport.normalizeStatus(request.getStatus()));
        entity.setPermissions(userAuthSupport.toPermissionsEmbeddable(request.getPermissions(), role));
        entity.setPhone(userAuthSupport.safe(request.getPhone()));
        String avatar = userAuthSupport.safe(request.getAvatarUrl());
        entity.setAvatarUrl(avatar.isEmpty() ? userAuthSupport.defaultAvatar(firstName, entity.getLastName()) : avatar);
        entity.setRegistrationDate(parseInstant(request.getRegistrationDate(), Instant.now()));
        if (!password.isEmpty()) {
            entity.setPasswordHash(userAuthSupport.hashPassword(email, password));
        } else {
            entity.setPasswordHash("");
        }

        return userAuthSupport.toUserResponse(userRepository.save(entity), "");
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable String id, @RequestBody UserRequest request) {
        UserEntity existing = findUser(id);

        String nextEmail = userAuthSupport.safe(request.getEmail()).toLowerCase();
        if (!nextEmail.isEmpty() && !nextEmail.equals(existing.getEmail())) {
            userRepository.findByEmailIgnoreCase(nextEmail).ifPresent(user -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered to another account.");
            });
            existing.setEmail(nextEmail);
        }

        String firstName = userAuthSupport.safe(request.getFirstName());
        if (!firstName.isEmpty()) {
            existing.setFirstName(firstName);
        }

        String lastName = userAuthSupport.safe(request.getLastName());
        if (!lastName.isEmpty()) {
            existing.setLastName(lastName);
        }

        String role = request.getRole() == null ? existing.getRole() : userAuthSupport.normalizeRole(request.getRole());
        existing.setRole(role);
        existing.setStatus(request.getStatus() == null ? existing.getStatus() : userAuthSupport.normalizeStatus(request.getStatus()));
        existing.setPermissions(userAuthSupport.toPermissionsEmbeddable(
            request.getPermissions() == null ? userAuthSupport.toPermissionsDto(existing.getPermissions(), existing.getRole()) : request.getPermissions(),
            role
        ));

        if (request.getPhone() != null) {
            existing.setPhone(userAuthSupport.safe(request.getPhone()));
        }

        if (request.getAvatarUrl() != null) {
            String avatar = userAuthSupport.safe(request.getAvatarUrl());
            existing.setAvatarUrl(avatar.isEmpty()
                ? userAuthSupport.defaultAvatar(existing.getFirstName(), existing.getLastName())
                : avatar
            );
        }

        if (request.getRegistrationDate() != null) {
            existing.setRegistrationDate(parseInstant(request.getRegistrationDate(), existing.getRegistrationDate()));
        }

        String password = userAuthSupport.safe(request.getPassword());
        if (!password.isEmpty()) {
            existing.setPasswordHash(userAuthSupport.hashPassword(existing.getEmail(), password));
        }

        return userAuthSupport.toUserResponse(userRepository.save(existing), "");
    }

    @PatchMapping("/{id}/status")
    public UserResponse updateStatus(@PathVariable String id, @RequestBody UserStatusUpdateRequest request) {
        UserEntity user = findUser(id);
        String targetStatus = request.getStatus() == null
            ? ("Active".equals(user.getStatus()) ? "Suspended" : "Active")
            : userAuthSupport.normalizeStatus(request.getStatus());
        user.setStatus(targetStatus);
        return userAuthSupport.toUserResponse(userRepository.save(user), "");
    }

    @PatchMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updatePassword(@PathVariable String id, @RequestBody PasswordChangeRequest request) {
        UserEntity user = findUser(id);
        String currentPassword = userAuthSupport.safe(request.getCurrentPassword());
        String newPassword = userAuthSupport.safe(request.getNewPassword());

        if (newPassword.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }

        if (!user.getPasswordHash().isEmpty()) {
            String expectedHash = userAuthSupport.hashPassword(user.getEmail(), currentPassword);
            if (!expectedHash.equals(user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect current password");
            }
        }

        user.setPasswordHash(userAuthSupport.hashPassword(user.getEmail(), newPassword));
        userRepository.save(user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        UserEntity user = findUser(id);
        userRepository.delete(user);
    }

    private UserEntity findUser(String id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Instant parseInstant(String rawValue, Instant fallback) {
        String value = userAuthSupport.safe(rawValue);
        if (value.isEmpty()) {
            return fallback;
        }

        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            return fallback;
        }
    }
}
