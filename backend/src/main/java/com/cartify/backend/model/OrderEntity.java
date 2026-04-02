package com.cartify.backend.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private Instant date;

    @ElementCollection
    @CollectionTable(name = "order_items")
    private List<OrderItemEmbeddable> items = new ArrayList<>();

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "firstName", column = @Column(name = "shipping_first_name")),
        @AttributeOverride(name = "lastName", column = @Column(name = "shipping_last_name")),
        @AttributeOverride(name = "address", column = @Column(name = "shipping_address", length = 3000)),
        @AttributeOverride(name = "city", column = @Column(name = "shipping_city")),
        @AttributeOverride(name = "postalCode", column = @Column(name = "shipping_postal_code")),
        @AttributeOverride(name = "phone", column = @Column(name = "shipping_phone"))
    })
    private ShippingDetailsEmbeddable shippingDetails = new ShippingDetailsEmbeddable();

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "name", column = @Column(name = "customer_name")),
        @AttributeOverride(name = "email", column = @Column(name = "customer_email")),
        @AttributeOverride(name = "address", column = @Column(name = "customer_address", length = 3000))
    })
    private CustomerDetailsEmbeddable customerDetails = new CustomerDetailsEmbeddable();

    @Column(nullable = false)
    private String paymentMethod;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal shippingFee;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private String status;

    @PrePersist
    void assignDefaults() {
        if (id == null || id.trim().isEmpty()) {
            id = buildOrderId();
        }

        if (date == null) {
            date = Instant.now();
        }

        if (status == null || status.trim().isEmpty()) {
            status = "Pending";
        }
    }

    private String buildOrderId() {
        String compact = UUID.randomUUID().toString().replace("-", "").substring(0, 9).toUpperCase(Locale.ROOT);
        return "ORD-" + compact;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Instant getDate() {
        return date;
    }

    public void setDate(Instant date) {
        this.date = date;
    }

    public List<OrderItemEmbeddable> getItems() {
        return items;
    }

    public void setItems(List<OrderItemEmbeddable> items) {
        this.items = items;
    }

    public ShippingDetailsEmbeddable getShippingDetails() {
        return shippingDetails;
    }

    public void setShippingDetails(ShippingDetailsEmbeddable shippingDetails) {
        this.shippingDetails = shippingDetails;
    }

    public CustomerDetailsEmbeddable getCustomerDetails() {
        return customerDetails;
    }

    public void setCustomerDetails(CustomerDetailsEmbeddable customerDetails) {
        this.customerDetails = customerDetails;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
