package com.bda.jobmarket.controller;

import com.bda.jobmarket.model.Company;
import com.bda.jobmarket.model.Job;
import com.bda.jobmarket.repository.CompanyRepository;
import com.bda.jobmarket.repository.JobRepository;
import com.bda.jobmarket.repository.UserRepository;
import com.bda.jobmarket.service.SkillCatalog;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** ADMIN role only (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    record JobReq(@NotBlank String title, @NotBlank String role, @NotBlank String company, @NotBlank String city,
                  @NotEmpty List<String> skills, @Positive double salaryLpa, String level, String type, String description) {}

    private final JobRepository jobs;
    private final CompanyRepository companies;
    private final UserRepository users;
    private final SkillCatalog catalog;

    public AdminController(JobRepository jobs, CompanyRepository companies, UserRepository users, SkillCatalog catalog) {
        this.jobs = jobs; this.companies = companies; this.users = users; this.catalog = catalog;
    }

    @PostMapping("/jobs")
    public Job addJob(@Valid @RequestBody JobReq r) {
        Company c = companies.findByName(r.company().trim())
                .orElseGet(() -> companies.save(new Company(null, r.company().trim(), "Technology")));
        Job saved = jobs.save(new Job(null, r.title().trim(), r.role().trim(), c.id(), c.name(), r.city(),
                catalog.normalize(r.skills()), r.salaryLpa(),
                r.level() == null ? "Mid" : r.level(), r.type() == null ? "Full-time" : r.type(),
                Instant.now(), r.description()));
        catalog.refresh();
        return saved;
    }

    @DeleteMapping("/jobs/{id}")
    public void deleteJob(@PathVariable String id) {
        if (!jobs.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found");
        jobs.deleteById(id);
    }

    @GetMapping("/users")
    public List<AuthController.UserView> users() {
        return users.findAll().stream().map(AuthController.UserView::of).toList();
    }
}
