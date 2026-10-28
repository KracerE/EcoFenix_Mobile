package com.ecofenix.backend.controller;

import com.ecofenix.backend.model.Item;
import com.ecofenix.backend.repository.ItemRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*")
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    // GET /api/items
    @GetMapping
    public List<Item> getAllItems() {
        return itemRepository.findByItemStatusNot("INACTIVE");
    }

    // POST /api/items
    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody Item item) {
        if (item.getPrice() < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "El precio debe ser mayor o igual a 0"));
        }
        Item saved = itemRepository.save(item);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateItem(@PathVariable Integer id, @RequestBody Item updates) {
        if (updates.getPrice() == null || updates.getPrice() < 0
                || updates.getStock() == null || updates.getStock() < 0
                || updates.getTitle() == null || updates.getTitle().isBlank()
                || updates.getDescription() == null || updates.getDescription().isBlank()
                || updates.getType() == null || updates.getCategoryId() == null
                || updates.getLocation() == null || updates.getLocation().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Revisa los datos del artículo"));
        }

        return itemRepository.findById(id).map(item -> {
            item.setTitle(updates.getTitle().trim());
            item.setDescription(updates.getDescription().trim());
            item.setType(updates.getType());
            item.setPrice(updates.getPrice());
            item.setStock(updates.getStock());
            item.setCategoryId(updates.getCategoryId());
            item.setLocation(updates.getLocation());
            if (updates.getStock() == 0) {
                item.setItemStatus("DELIVERED");
            } else if ("DELIVERED".equals(item.getItemStatus())) {
                item.setItemStatus("AVAILABLE");
            }
            return ResponseEntity.ok(itemRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/purchase")
    @Transactional
    public ResponseEntity<?> purchaseItems(@RequestBody List<PurchaseItemRequest> purchases) {
        if (purchases == null || purchases.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "La compra debe incluir al menos un artículo"));
        }

        Set<Integer> itemIds = new HashSet<>();
        List<Item> itemsToUpdate = new ArrayList<>();
        for (PurchaseItemRequest purchase : purchases) {
            if (purchase == null || purchase.itemId() == null || purchase.quantity() == null
                    || purchase.quantity() <= 0 || !itemIds.add(purchase.itemId())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Los artículos o cantidades de la compra no son válidos"));
            }

            Item item = itemRepository.findById(purchase.itemId()).orElse(null);
            if (item == null || !"AVAILABLE".equals(item.getItemStatus())
                    || item.getStock() == null || item.getStock() < purchase.quantity()) {
                return ResponseEntity.status(409).body(Map.of("message", "No hay stock suficiente para completar la compra"));
            }
            itemsToUpdate.add(item);
        }

        for (int i = 0; i < itemsToUpdate.size(); i++) {
            Item item = itemsToUpdate.get(i);
            int remainingStock = item.getStock() - purchases.get(i).quantity();
            item.setStock(remainingStock);
            if (remainingStock == 0) {
                item.setItemStatus("DELIVERED");
            }
        }

        return ResponseEntity.ok(itemRepository.saveAll(itemsToUpdate));
    }

    // DELETE /api/items/{id} (Eliminación lógica - Sección 15.2.3)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLogical(@PathVariable Integer id) {
        return itemRepository.findById(id).map(item -> {
            item.setItemStatus("INACTIVE");
            itemRepository.save(item);
            return ResponseEntity.ok(Map.of("message", "Artículo eliminado lógicamente"));
        }).orElse(ResponseEntity.notFound().build());
    }

    public record PurchaseItemRequest(Integer itemId, Integer quantity) {}
}