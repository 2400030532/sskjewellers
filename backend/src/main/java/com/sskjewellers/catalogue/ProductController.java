package com.sskjewellers.catalogue;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalogue")
public class ProductController {
  private final ProductRepository products;

  public ProductController(ProductRepository products) {
    this.products = products;
  }

  @GetMapping
  public List<Product> all() {
    return products.findAll();
  }

  @PostMapping
  public ResponseEntity<Product> create(@RequestBody Product product, Authentication authentication) {
    product.setId("ssk-custom-" + UUID.randomUUID());
    return ResponseEntity.status(HttpStatus.CREATED).body(products.save(product));
  }

  @PutMapping("/{id}")
  public ResponseEntity<Product> update(@PathVariable String id, @RequestBody Product product, Authentication authentication) {
    if (!products.existsById(id)) return ResponseEntity.notFound().build();
    product.setId(id);
    return ResponseEntity.ok(products.save(product));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id, Authentication authentication) {
    if (!products.existsById(id)) return ResponseEntity.notFound().build();
    products.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
