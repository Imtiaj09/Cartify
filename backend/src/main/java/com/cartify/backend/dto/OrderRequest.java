package com.cartify.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderRequest {

    private String id;
    private String userId;
    private String date;
    private List<OrderItemRequest> items;
    private ShippingDetailsDto shippingDetails;
    private OrderCustomerDetailsDto customerDetails;
    private String paymentMethod;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private String status;

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

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public ShippingDetailsDto getShippingDetails() {
        return shippingDetails;
    }

    public void setShippingDetails(ShippingDetailsDto shippingDetails) {
        this.shippingDetails = shippingDetails;
    }

    public OrderCustomerDetailsDto getCustomerDetails() {
        return customerDetails;
    }

    public void setCustomerDetails(OrderCustomerDetailsDto customerDetails) {
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
