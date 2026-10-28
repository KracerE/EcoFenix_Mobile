package com.ecofenix.backend.controller;

import com.ecofenix.backend.model.User;
import com.ecofenix.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // POST /api/user/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El email es obligatorio"));
        }
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre de usuario es obligatorio"));
        }
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "La contraseña debe tener al menos 6 caracteres"));
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El email ya está registrado"));
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre de usuario ya está registrado"));
        }

        User saved = userRepository.save(user);
        saved.setPassword(null); // No devolver la contraseña por seguridad
        return ResponseEntity.status(201).body(saved);
    }

    // POST /api/user/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String emailOrUser = credentials.get("emailOrUsername");
        String password = credentials.get("password");

        Optional<User> userOpt = userRepository.findByEmail(emailOrUser);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(emailOrUser);
        }

        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of("message", "Credenciales inválidas"));
        }

        User user = userOpt.get();
        user.setPassword(null);
        return ResponseEntity.ok(Map.of(
            "token", "jwt-token-ecofenix-" + user.getId(),
            "user", user
        ));
    }
}