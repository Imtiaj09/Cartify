package com.cartify.backend.model;

import java.time.Instant;
import java.util.UUID;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String role;

    @Embedded
    private AdminPermissionsEmbeddable permissions = new AdminPermissionsEmbeddable();

    @Column(nullable = false)
    private Instant registrationDate;

    @Column(nullable = false)
    private String passwordHash;

    private String phone;

    @Column(length = 3000)
    private String avatarUrl;

    @PrePersist
    void assignDefaults() {
        if (id == null || id.trim().isEmpty()) {
            id = UUID.randomUUID().toString();
        }

        if (registrationDate == null) {
            registrationDate = Instant.now();
        }

        if (status == null || status.trim().isEmpty()) {
            status = "Active";
        }

        if (role == null || role.trim().isEmpty()) {
            role = "Customer";
        }

        if (permissions == null) {
            permissions = new AdminPermissionsEmbeddable();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public AdminPermissionsEmbeddable getPermissions() {
        return permissions;
    }

    public void setPermissions(AdminPermissionsEmbeddable permissions) {
        this.permissions = permissions;
    }

    public Instant getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
