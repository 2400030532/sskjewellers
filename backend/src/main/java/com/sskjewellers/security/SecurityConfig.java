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
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {
  @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

  @Bean CorsConfigurationSource corsConfigurationSource(@Value("${spring.web.cors.allowed-origins:*}") String origin) {
    CorsConfiguration config = new CorsConfiguration();
    List<String> origins = Arrays.stream(origin.split(","))
      .map(String::trim)
      .filter(value -> !value.isBlank())
      .collect(Collectors.toList());
    if (origins.isEmpty() || origins.contains("*")) {
      config.setAllowedOriginPatterns(List.of("*"));
    } else {
      config.setAllowedOriginPatterns(origins);
    }
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

  @Bean SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
    return http.csrf(csrf -> csrf.disable()).cors(cors -> {}).sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/api/auth/login", "/actuator/health").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/rates", "/api/catalogue/**").permitAll()
        .requestMatchers(HttpMethod.PUT, "/api/rates").hasRole("ADMIN")
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().permitAll())
      .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class).build();
  }
}