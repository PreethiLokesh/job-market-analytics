package com.bda.jobmarket.controller;

import com.bda.jobmarket.model.User;
import com.bda.jobmarket.repository.UserRepository;
import com.bda.jobmarket.security.JwtService;
import com.bda.jobmarket.service.SkillCatalog;
import com.bda.jobmarket.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AuthController {
    record SignupReq(@NotBlank String name, @NotBlank @Email String email,
                     @NotBlank @Size(min = 6, message = "must be at least 6 characters") String password,
                     String city, List<String> skills) {}
    record LoginReq(@NotBlank String email, @NotBlank String password) {}
    record ProfileReq(@NotBlank String name, String city, List<String> skills) {}

    /** What the API returns about a user (never the password hash). */
    public record UserView(String id, String name, String email, String role, List<String> skills, String city) {
        public static UserView of(User u) {
            return new UserView(u.id(), u.name(), u.email(), u.role(), u.skills(), u.city());
        }
    }

    private final UserRepository users;
    private final UserService userService;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final SkillCatalog catalog;

    public AuthController(UserRepository users, UserService userService, PasswordEncoder encoder,
                          JwtService jwt, SkillCatalog catalog) {
        this.users = users; this.userService = userService; this.encoder = encoder; this.jwt = jwt; this.catalog = catalog;
    }

    @PostMapping("/auth/signup")
    public Map<String, Object> signup(@Valid @RequestBody SignupReq r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        User u = users.save(new User(null, r.name().trim(), email, encoder.encode(r.password()), "USER",
                catalog.normalize(r.skills()), r.city(), Instant.now()));
        return tokenResponse(u);
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(@Valid @RequestBody LoginReq r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .filter(x -> encoder.matches(r.password(), x.passwordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return tokenResponse(u);
    }

    @GetMapping("/me")
    public UserView me(Authentication auth) { return UserView.of(userService.current(auth)); }

    @PutMapping("/me")
    public UserView updateProfile(@Valid @RequestBody ProfileReq r, Authentication auth) {
        User u = userService.current(auth);
        return UserView.of(users.save(new User(u.id(), r.name().trim(), u.email(), u.passwordHash(), u.role(),
                catalog.normalize(r.skills()), r.city(), u.createdAt())));
    }

    private Map<String, Object> tokenResponse(User u) {
        return Map.of("token", jwt.create(u.email(), u.role()), "user", UserView.of(u));
    }
}
