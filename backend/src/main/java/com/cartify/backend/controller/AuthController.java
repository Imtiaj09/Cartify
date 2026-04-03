package com.cartify.backend.controller;

import com.cartify.backend.dto.AuthResponse;
import com.cartify.backend.dto.LoginRequest;
import com.cartify.backend.dto.RegisterRequest;
import com.cartify.backend.model.UserEntity;
import com.cartify.backend.repository.UserRepository;
import com.cartify.backend.service.UserAuthSupport;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
@CrossOrigin(originPatterns = {
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://0.0.0.0:*",
    "https://localhost:*",
    "https://127.0.0.1:*",
    "https://0.0.0.0:*"
})
public class AuthController {

    private final UserRepository userRepository;
    private final UserAuthSupport userAuthSupport;

    public AuthController(UserRepository userRepository, UserAuthSupport userAuthSupport) {
        this.userRepository = userRepository;
        this.userAuthSupport = userAuthSupport;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        String firstName = userAuthSupport.safe(request.getFirstName());
        String lastName = userAuthSupport.safe(request.getLastName());
        String email = userAuthSupport.safe(request.getEmail()).toLowerCase();
        String password = userAuthSupport.safe(request.getPassword());

        if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required registration fields");
        }

        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        });

        UserEntity entity = new UserEntity();
        entity.setFirstName(firstName);
        entity.setLastName(lastName);
        entity.setEmail(email);
        entity.setStatus("Active");
        entity.setRole("Customer");
        entity.setPermissions(userAuthSupport.toPermissionsEmbeddable(null, "Customer"));
        entity.setRegistrationDate(Instant.now());
        entity.setPhone(userAuthSupport.safe(request.getPhone()));
        String avatarUrl = userAuthSupport.safe(request.getAvatarUrl());
        entity.setAvatarUrl(avatarUrl.isEmpty() ? userAuthSupport.defaultAvatar(firstName, lastName) : avatarUrl);
        entity.setPasswordHash(userAuthSupport.hashPassword(email, password));

        UserEntity saved = userRepository.save(entity);
        String token = userAuthSupport.issueToken(saved);

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(userAuthSupport.toUserResponse(saved, token));
        return response;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        String email = userAuthSupport.safe(request.getEmail()).toLowerCase();
        String password = userAuthSupport.safe(request.getPassword());

        if (email.isEmpty() || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        UserEntity user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        String candidateHash = userAuthSupport.hashPassword(email, password);
        if (!candidateHash.equals(user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if ("Suspended".equals(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is suspended. Please contact support.");
        }

        String token = userAuthSupport.issueToken(user);
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(userAuthSupport.toUserResponse(user, token));
        return response;
    }
}
