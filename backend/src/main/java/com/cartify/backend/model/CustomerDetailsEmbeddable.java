package com.cartify.backend.model;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@Embeddable
public class CustomerDetailsEmbeddable {

    private String name;
    private String email;

    @Column(length = 3000)
    private String address;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
