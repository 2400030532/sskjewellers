package com.sskjewellers.rates;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/rates")
public class LiveRatesController {
  private static final double TROY_OUNCE_TO_GRAMS = 31.1034768;
  private final HttpClient httpClient = HttpClient.newHttpClient();
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final String apiKey;

  public LiveRatesController(@Value("${app.metalprice.api-key:}") String apiKey) {
    this.apiKey = apiKey;
  }

  @GetMapping("/live")
  public ResponseEntity<?> liveRates() {
    if (apiKey.isBlank()) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(Map.of("error", "MetalpriceAPI is not configured"));
    }

    try {
      URI uri = URI.create("https://api.metalpriceapi.com/v1/latest?api_key=" + apiKey + "&base=USD&currencies=INR,XAU,XAG");
      HttpRequest request = HttpRequest.newBuilder(uri).header("Accept", "application/json").GET().build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "MetalpriceAPI request failed"));
      }

      JsonNode root = objectMapper.readTree(response.body());
      if (!root.path("success").asBoolean(false)) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "MetalpriceAPI returned an error"));
      }

      double usdToInr = root.path("rates").path("INR").asDouble(0);
      double goldPerUsd = root.path("rates").path("XAU").asDouble(0);
      double silverPerUsd = root.path("rates").path("XAG").asDouble(0);
      if (usdToInr <= 0 || goldPerUsd <= 0 || silverPerUsd <= 0) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "MetalpriceAPI returned incomplete rates"));
      }

      double goldPerGram = (usdToInr / goldPerUsd) / TROY_OUNCE_TO_GRAMS;
      double silverPerGram = (usdToInr / silverPerUsd) / TROY_OUNCE_TO_GRAMS;
      double gold24k = Math.round(goldPerGram);
      return ResponseEntity.ok(Map.of(
          "gold24k", gold24k,
          "gold22k", Math.round(gold24k * 22 / 24),
          "gold18k", Math.round(gold24k * 18 / 24),
          "silver", Math.round(silverPerGram * 10) / 10.0,
          "source", "MetalpriceAPI"));
    } catch (Exception exception) {
      return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Unable to fetch live metal rates"));
    }
  }
}
