package com.cartify.backend.model;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@Embeddable
public class AdminPermissionsEmbeddable {

    @Column(name = "perm_manage_products", nullable = false)
    private boolean manageProducts;

    @Column(name = "perm_manage_orders", nullable = false)
    private boolean manageOrders;

    @Column(name = "perm_manage_users", nullable = false)
    private boolean manageUsers;

    @Column(name = "perm_view_reports", nullable = false)
    private boolean viewReports;

    public boolean isManageProducts() {
        return manageProducts;
    }

    public void setManageProducts(boolean manageProducts) {
        this.manageProducts = manageProducts;
    }

    public boolean isManageOrders() {
        return manageOrders;
    }

    public void setManageOrders(boolean manageOrders) {
        this.manageOrders = manageOrders;
    }

    public boolean isManageUsers() {
        return manageUsers;
    }

    public void setManageUsers(boolean manageUsers) {
        this.manageUsers = manageUsers;
    }

    public boolean isViewReports() {
        return viewReports;
    }

    public void setViewReports(boolean viewReports) {
        this.viewReports = viewReports;
    }
}
