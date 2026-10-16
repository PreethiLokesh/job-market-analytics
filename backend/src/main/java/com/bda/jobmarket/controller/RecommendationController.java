package com.bda.jobmarket.controller;

import com.bda.jobmarket.service.RecommendationService;
import com.bda.jobmarket.service.UserService;
import java.util.List;
import org.bson.Document;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RecommendationController {
    record Req(List<String> skills, String city) {}

    private final RecommendationService service;
    private final UserService userService;

    public RecommendationController(RecommendationService service, UserService userService) {
        this.service = service; this.userService = userService;
    }

    /** The demo feature: send skills, get ranked jobs. */
    @PostMapping("/recommend")
    public List<Document> recommend(@RequestBody Req r) {
        return service.recommend(r.skills(), r.city(), 20);
    }

    /** Same thing, using the skills saved in the user's profile. */
    @GetMapping("/me/recommendations")
    public List<Document> mine(Authentication auth) {
        return service.recommend(userService.current(auth).skills(), null, 20);
    }
}
