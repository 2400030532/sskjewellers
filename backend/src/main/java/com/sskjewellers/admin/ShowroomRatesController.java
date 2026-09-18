package com.sskjewellers.admin;

import java.time.Instant;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rates")
public class ShowroomRatesController {
  private final ShowroomRatesRepository repository;

  public ShowroomRatesController(ShowroomRatesRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public ResponseEntity<?> current() {
    return repository.findById(1L).<ResponseEntity<?>>map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PutMapping
  public ShowroomRates update(@RequestBody RateUpdate request, Authentication authentication) {
    ShowroomRates rates = repository.findById(1L)
        .orElseGet(() -> new ShowroomRates(request.gold22k(), request.gold24k(), request.gold18k(), request.silver(), Instant.now().toString()));
    rates.setGold22k(request.gold22k());
    rates.setGold24k(request.gold24k());
    rates.setGold18k(request.gold18k());
    rates.setSilver(request.silver());
    rates.setUpdatedAt(Instant.now().toString());
    return repository.save(rates);
  }

  public record RateUpdate(double gold22k, double gold24k, double gold18k, double silver) {}
}
