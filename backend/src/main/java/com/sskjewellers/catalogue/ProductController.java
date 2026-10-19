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
@RequestMapping({"/api/catalogue", "/api/products"})
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
    autoClassifyTryOn(product);
    return ResponseEntity.status(HttpStatus.CREATED).body(products.save(product));
  }

  @PutMapping("/{id}")
  public ResponseEntity<Product> update(@PathVariable String id, @RequestBody Product product, Authentication authentication) {
    product.setId(id);
    autoClassifyTryOn(product);
    return ResponseEntity.ok(products.save(product));
  }

  @PostMapping(value = {"/{id}/model", "/{id}/upload-model"}, consumes = {"multipart/form-data"})
  public ResponseEntity<java.util.Map<String, Object>> uploadModel(
      @PathVariable String id,
      @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file,
      Authentication authentication) {
    if (file == null || file.isEmpty()) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", "Uploaded model file cannot be empty."));
    }
    String origName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
    if (!origName.endsWith(".glb") && !origName.endsWith(".gltf")) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", "File must have a .glb or .gltf extension."));
    }

    try {
      String cleanId = id.replaceAll("[/\\\\]", "_");
      String ext = origName.endsWith(".gltf") ? ".gltf" : ".glb";
      String relPath = "assets/models/" + cleanId + ext;

      java.io.File modelDir = new java.io.File("assets/models");
      if (!modelDir.exists()) modelDir.mkdirs();
      java.io.File dest = new java.io.File(modelDir, cleanId + ext);
      file.transferTo(dest.toPath());

      Product p = products.findById(id).orElseGet(() -> {
        Product newP = new Product();
        newP.setId(id);
        return newP;
      });
      p.setModel3dUrl(relPath);
      p.setModel3dStatus("COMPLETED");
      p.setIs3dPublished(true);
      p.setModel3dError(null);
      p.setModel3dGeneratedAt(System.currentTimeMillis());
      products.save(p);

      java.util.Map<String, Object> res = new java.util.HashMap<>();
      res.put("success", true);
      res.put("productId", id);
      res.put("model3dUrl", relPath);
      res.put("model3dStatus", "COMPLETED");
      res.put("is3dPublished", true);
      return ResponseEntity.ok(res);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(java.util.Map.of("error", "Failed to store 3D model: " + e.getMessage()));
    }
  }

  private void autoClassifyTryOn(Product product) {
    if (product.isTryOnEnabled() && product.getTryOnType() != null && !product.getTryOnType().isBlank()) {
      return;
    }
    String category = product.getCategory() == null ? "" : product.getCategory().toLowerCase();
    String name = product.getName() == null ? "" : product.getName().toLowerCase();
    String telugu = product.getTeluguName() == null ? "" : product.getTeluguName().toLowerCase();
    String text = (name + " " + telugu + " " + category).toLowerCase();

    if (category.equals("silver-pooja") || category.equals("gold-coins") ||
        text.contains("coin") || text.contains("deepam") || text.contains("kalasam") ||
        text.contains("panchapatra") || text.contains("harathi")) {
      product.setTryOnEnabled(false);
      product.setTryOnType("NONE");
      return;
    }

    product.setTryOnEnabled(true);
    if (text.matches(".*(earring|jhumka|buttalu|kammalu|stud|chandbali|drops|hanging|bali|tops).*")) {
      product.setTryOnType("EARRINGS");
      if (product.getTryOnAsset() == null || product.getTryOnAsset().isBlank()) {
        product.setTryOnAsset("assets/tryon/peacock_jhumka.svg");
      }
      product.setTryOnScale(0.22);
      product.setTryOnOffsetY(10.0);
    } else if (text.matches(".*(choker|guttapusalu|collar|hasli|kanthi).*")) {
      product.setTryOnType("CHOKER");
      if (product.getTryOnAsset() == null || product.getTryOnAsset().isBlank()) {
        product.setTryOnAsset("assets/tryon/guttapusalu_choker.svg");
      }
      product.setTryOnScale(1.25);
      product.setTryOnOffsetY(25.0);
    } else if (text.matches(".*(tikka|maang|papidi|billa|mathapatti).*")) {
      product.setTryOnType("MAANG_TIKKA");
      if (product.getTryOnAsset() == null || product.getTryOnAsset().isBlank()) {
        product.setTryOnAsset("assets/tryon/maang_tikka.svg");
      }
      product.setTryOnScale(0.28);
      product.setTryOnOffsetY(-5.0);
    } else {
      product.setTryOnType("NECKLACE");
      if (product.getTryOnAsset() == null || product.getTryOnAsset().isBlank()) {
        product.setTryOnAsset("assets/tryon/kasu_mala_pendant.svg");
      }
      product.setTryOnScale(1.45);
      product.setTryOnOffsetY(45.0);
    }
  }

  @GetMapping("/{id}/try-on-asset")
  public ResponseEntity<java.util.Map<String, Object>> getTryOnAsset(@PathVariable String id) {
    return products.findById(id)
      .map(p -> {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("productId", p.getId());
        map.put("tryOnEnabled", p.isTryOnEnabled());
        map.put("tryOnType", p.getTryOnType());
        map.put("tryOnAsset", p.getTryOnAsset());
        map.put("tryOnMask", p.getTryOnMask());
        map.put("maskQualityScore", p.getMaskQualityScore());
        map.put("maskQualityStatus", p.getMaskQualityStatus());
        map.put("jewelleryBBox", p.getJewelleryBBox());
        map.put("anchorPoints", p.getAnchorPoints());
        return ResponseEntity.ok(map);
      })
      .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/{id}/generate-3d")
  public ResponseEntity<java.util.Map<String, Object>> generate3D(@PathVariable String id, @RequestBody(required = false) java.util.Map<String, Object> req) {
    return products.findById(id)
      .map(p -> {
        p.setModel3dStatus("PROCESSING");
        p.setModel3dError(null);
        p.setModel3dGeneratedAt(System.currentTimeMillis());
        products.save(p);

        // Asynchronous AI call or worker
        new Thread(() -> {
          try {
            String aiUrl = System.getenv("AI_SERVICE_URL");
            if (aiUrl == null || aiUrl.isBlank()) aiUrl = "http://localhost:8001";
            java.net.URI uri = java.net.URI.create(aiUrl + "/api/products/" + id + "/generate-3d");
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String payload = "{\"category\":\"" + (p.getCategory() != null ? p.getCategory() : "NECKLACE") + "\",\"metal\":\"" + (p.getMetal() != null ? p.getMetal() : "gold") + "\",\"image\":\"" + (p.getImage() != null ? p.getImage() : "") + "\"}";
            java.net.http.HttpRequest httpReq = java.net.http.HttpRequest.newBuilder(uri)
              .header("Content-Type", "application/json")
              .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload))
              .build();
            client.send(httpReq, java.net.http.HttpResponse.BodyHandlers.ofString());
          } catch (Exception ignored) {}
        }).start();

        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("success", true);
        map.put("productId", p.getId());
        map.put("status", "PROCESSING");
        map.put("message", "2D-to-3D reconstruction initiated.");
        return ResponseEntity.accepted().body(map);
      })
      .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/{id}/3d-status")
  public ResponseEntity<java.util.Map<String, Object>> get3DStatus(@PathVariable String id) {
    return products.findById(id)
      .map(p -> {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("productId", p.getId());
        String status = p.getModel3dStatus();
        if (status == null || status.isBlank()) {
          status = (p.getModel3dUrl() != null && !p.getModel3dUrl().isBlank()) ? "COMPLETED" : "NONE";
        }
        map.put("status", status);
        map.put("model3dUrl", p.getModel3dUrl());
        map.put("is3dPublished", p.isIs3dPublished());
        map.put("qualityScore", p.getModel3dQuality() != null ? p.getModel3dQuality() : 90);
        map.put("error", p.getModel3dError());
        return ResponseEntity.ok(map);
      })
      .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/{id}/3d-model")
  public ResponseEntity<java.util.Map<String, Object>> get3DModel(@PathVariable String id) {
    return products.findById(id)
      .map(p -> {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("productId", p.getId());
        map.put("model3dUrl", p.getModel3dUrl());
        map.put("isPublished", p.isIs3dPublished());
        return ResponseEntity.ok(map);
      })
      .orElse(ResponseEntity.notFound().build());
  }

  @PutMapping("/{id}/3d-settings")
  public ResponseEntity<Product> update3DSettings(@PathVariable String id, @RequestBody java.util.Map<String, Object> settings) {
    return products.findById(id)
      .map(p -> {
        if (settings.containsKey("is3dPublished")) {
          p.setIs3dPublished(Boolean.parseBoolean(String.valueOf(settings.get("is3dPublished"))));
        }
        if (settings.containsKey("model3dUrl")) {
          p.setModel3dUrl(String.valueOf(settings.get("model3dUrl")));
          p.setModel3dStatus("COMPLETED");
        }
        return ResponseEntity.ok(products.save(p));
      })
      .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/try-on/session")
  public ResponseEntity<java.util.Map<String, Object>> tryOnSession() {
    return ResponseEntity.ok(java.util.Map.of("status", "ACTIVE", "sessionId", "ssk-vto-" + System.currentTimeMillis()));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id, Authentication authentication) {
    if (!products.existsById(id)) return ResponseEntity.notFound().build();
    products.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
