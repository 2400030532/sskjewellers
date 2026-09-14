package com.sskjewellers.admin;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  @GetMapping("/session")
  public Map<String, String> session(Authentication authentication) {
    return Map.of("username", authentication.getName(), "role", "ADMIN", "status", "authenticated");
  }
}