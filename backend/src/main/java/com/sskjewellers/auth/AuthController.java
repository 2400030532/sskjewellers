package com.sskjewellers.auth;

import com.sskjewellers.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthenticationManager authenticationManager;
  private final UserDetailsService users;
  private final JwtService jwtService;
  public AuthController(AuthenticationManager authenticationManager, UserDetailsService users, JwtService jwtService) { this.authenticationManager = authenticationManager; this.users = users; this.jwtService = jwtService; }

  @PostMapping("/login")
  public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
    authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
    return ResponseEntity.ok(new TokenResponse(jwtService.issue(users.loadUserByUsername(request.username()))));
  }

  public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
  public record TokenResponse(String token) {}
}