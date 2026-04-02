package com.cartify.backend.dto;

public class AdminPermissionsDto {

    private boolean manageProducts;
    private boolean manageOrders;
    private boolean manageUsers;
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
