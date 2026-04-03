package com.cartify.backend.controller;

import com.cartify.backend.dto.OrderCustomerDetailsDto;
import com.cartify.backend.dto.OrderItemRequest;
import com.cartify.backend.dto.OrderRequest;
import com.cartify.backend.dto.OrderResponse;
import com.cartify.backend.dto.OrderStatusUpdateRequest;
import com.cartify.backend.dto.ShippingDetailsDto;
import com.cartify.backend.model.CustomerDetailsEmbeddable;
import com.cartify.backend.model.OrderEntity;
import com.cartify.backend.model.OrderItemEmbeddable;
import com.cartify.backend.model.ShippingDetailsEmbeddable;
import com.cartify.backend.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
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
@RequestMapping("/api/orders")
@CrossOrigin(originPatterns = {
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://0.0.0.0:*",
    "https://localhost:*",
    "https://127.0.0.1:*",
    "https://0.0.0.0:*"
})
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<OrderResponse> getAll() {
        return orderRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable String id) {
        OrderEntity entity = findOrder(id);
        return toResponse(entity);
    }

    @GetMapping("/user/{userId}")
    public List<OrderResponse> getByUser(@PathVariable String userId) {
        return orderRepository.findByUserIdOrderByDateDesc(userId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@RequestBody OrderRequest request) {
        OrderEntity entity = new OrderEntity();
        applyRequest(entity, request);
        return toResponse(orderRepository.save(entity));
    }

    @PutMapping("/{id}")
    public OrderResponse update(@PathVariable String id, @RequestBody OrderRequest request) {
        OrderEntity entity = findOrder(id);
        applyRequest(entity, request);
        return toResponse(orderRepository.save(entity));
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable String id, @RequestBody OrderStatusUpdateRequest request) {
        OrderEntity entity = findOrder(id);
        String status = safe(request.getStatus());
        entity.setStatus(status.isEmpty() ? entity.getStatus() : status);
        return toResponse(orderRepository.save(entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        OrderEntity entity = findOrder(id);
        orderRepository.delete(entity);
    }

    private OrderEntity findOrder(String id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private void applyRequest(OrderEntity entity, OrderRequest request) {
        String userId = safe(request.getUserId());
        if (userId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order userId is required");
        }

        entity.setUserId(userId);
        if (request.getId() != null && !safe(request.getId()).isEmpty()) {
            entity.setId(safe(request.getId()));
        }

        entity.setDate(parseInstant(request.getDate(), entity.getDate() == null ? Instant.now() : entity.getDate()));
        entity.setItems(toItems(request.getItems()));
        entity.setShippingDetails(toShippingEmbeddable(request.getShippingDetails()));
        entity.setCustomerDetails(toCustomerEmbeddable(request.getCustomerDetails()));
        entity.setPaymentMethod(safe(request.getPaymentMethod()).isEmpty() ? "cod" : safe(request.getPaymentMethod()));
        entity.setSubtotal(request.getSubtotal() == null ? BigDecimal.ZERO : request.getSubtotal());
        entity.setShippingFee(request.getShippingFee() == null ? BigDecimal.ZERO : request.getShippingFee());
        entity.setTotal(request.getTotal() == null ? BigDecimal.ZERO : request.getTotal());
        entity.setStatus(safe(request.getStatus()).isEmpty() ? "Pending" : safe(request.getStatus()));
    }

    private List<OrderItemEmbeddable> toItems(List<OrderItemRequest> requests) {
        if (requests == null) {
            return new ArrayList<>();
        }

        return requests.stream().map(item -> {
            OrderItemEmbeddable embeddable = new OrderItemEmbeddable();
            embeddable.setProductId(item.getProductId());
            embeddable.setProductName(safe(item.getProductName()));
            embeddable.setMainImage(safe(item.getMainImage()));
            embeddable.setPrice(item.getPrice() == null ? BigDecimal.ZERO : item.getPrice());
            embeddable.setDiscountedPrice(item.getDiscountedPrice());
            embeddable.setQuantity(item.getQuantity() == null || item.getQuantity() < 1 ? 1 : item.getQuantity());
            embeddable.setSelectedColor(safe(item.getSelectedColor()));
            return embeddable;
        }).collect(Collectors.toList());
    }

    private ShippingDetailsEmbeddable toShippingEmbeddable(ShippingDetailsDto dto) {
        ShippingDetailsEmbeddable embeddable = new ShippingDetailsEmbeddable();
        if (dto == null) {
            return embeddable;
        }

        embeddable.setFirstName(safe(dto.getFirstName()));
        embeddable.setLastName(safe(dto.getLastName()));
        embeddable.setAddress(safe(dto.getAddress()));
        embeddable.setCity(safe(dto.getCity()));
        embeddable.setPostalCode(safe(dto.getPostalCode()));
        embeddable.setPhone(safe(dto.getPhone()));
        return embeddable;
    }

    private CustomerDetailsEmbeddable toCustomerEmbeddable(OrderCustomerDetailsDto dto) {
        CustomerDetailsEmbeddable embeddable = new CustomerDetailsEmbeddable();
        if (dto == null) {
            return embeddable;
        }

        embeddable.setName(safe(dto.getName()));
        embeddable.setEmail(safe(dto.getEmail()));
        embeddable.setAddress(safe(dto.getAddress()));
        return embeddable;
    }

    private OrderResponse toResponse(OrderEntity entity) {
        OrderResponse response = new OrderResponse();
        response.setId(entity.getId());
        response.setUserId(entity.getUserId());
        response.setDate(entity.getDate() == null ? Instant.now().toString() : entity.getDate().toString());
        response.setItems(entity.getItems().stream().map(item -> {
            OrderItemRequest itemDto = new OrderItemRequest();
            itemDto.setProductId(item.getProductId());
            itemDto.setProductName(item.getProductName());
            itemDto.setMainImage(item.getMainImage());
            itemDto.setPrice(item.getPrice());
            itemDto.setDiscountedPrice(item.getDiscountedPrice());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setSelectedColor(item.getSelectedColor());
            return itemDto;
        }).collect(Collectors.toList()));

        ShippingDetailsDto shipping = new ShippingDetailsDto();
        if (entity.getShippingDetails() != null) {
            shipping.setFirstName(entity.getShippingDetails().getFirstName());
            shipping.setLastName(entity.getShippingDetails().getLastName());
            shipping.setAddress(entity.getShippingDetails().getAddress());
            shipping.setCity(entity.getShippingDetails().getCity());
            shipping.setPostalCode(entity.getShippingDetails().getPostalCode());
            shipping.setPhone(entity.getShippingDetails().getPhone());
        }
        response.setShippingDetails(shipping);

        OrderCustomerDetailsDto customer = new OrderCustomerDetailsDto();
        if (entity.getCustomerDetails() != null) {
            customer.setName(entity.getCustomerDetails().getName());
            customer.setEmail(entity.getCustomerDetails().getEmail());
            customer.setAddress(entity.getCustomerDetails().getAddress());
        }
        response.setCustomerDetails(customer);
        response.setPaymentMethod(entity.getPaymentMethod());
        response.setSubtotal(entity.getSubtotal());
        response.setShippingFee(entity.getShippingFee());
        response.setTotal(entity.getTotal());
        response.setStatus(entity.getStatus());
        return response;
    }

    private Instant parseInstant(String rawValue, Instant fallback) {
        String value = safe(rawValue);
        if (value.isEmpty()) {
            return fallback;
        }

        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            return fallback;
        }
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
