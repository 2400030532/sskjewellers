package com.sskjewellers.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.cors.CorsUtils;
import java.util.List;
import java.util.Arrays;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.ArrayList;

@Configuration
public class SecurityConfig {
  @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

  @Bean
  public CorsFilter corsFilter(CorsConfigurationSource corsConfigurationSource) {
    return new CorsFilter(corsConfigurationSource);
  }

  @Bean CorsConfigurationSource corsConfigurationSource(@Value("${spring.web.cors.allowed-origins:https://2400030532.github.io}") String origin) {
    CorsConfiguration config = new CorsConfiguration();
    Set<String> origins = new LinkedHashSet<>();
    if (origin != null && !origin.isBlank()) {
      for (String o : origin.split(",")) {
        String trimmed = o.trim();
        if (!trimmed.isEmpty()) {
          origins.add(trimmed);
          origins.add(trimmed.replaceAll("/+$", ""));
          try {
            java.net.URI uri = java.net.URI.create(trimmed);
            if (uri.getHost() != null) {
              origins.add((uri.getScheme() != null ? uri.getScheme() : "https") + "://" + uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : ""));
            }
          } catch (Exception ignored) {}
        }
      }
    }
    // Always include project GitHub Pages origin
    origins.add("https://2400030532.github.io");
    config.setAllowedOriginPatterns(new ArrayList<>(origins));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
    config.setExposedHeaders(List.of("Authorization"));
    config.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  @Bean UserDetailsService users(@Value("${app.admin.username}") String username,
      @Value("${app.admin.password}") String password,
      PasswordEncoder passwordEncoder) {
    if (password == null || password.isBlank()) {
      throw new IllegalStateException("ADMIN_PASSWORD must be configured in environment variables");
    }
    return new InMemoryUserDetailsManager(User.withUsername(username).password(passwordEncoder.encode(password)).roles("ADMIN").build());
  }

  @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception { return config.getAuthenticationManager(); }

  @Bean SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter, CorsConfigurationSource corsConfigurationSource) throws Exception {
    return http.csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfigurationSource))
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(CorsUtils::isPreFlightRequest).permitAll()
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/api/auth/login", "/actuator/health").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/rates", "/api/catalogue/**").permitAll()
        .requestMatchers(HttpMethod.PUT, "/api/rates").hasRole("ADMIN")
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().permitAll())
      .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class).build();
  }
}