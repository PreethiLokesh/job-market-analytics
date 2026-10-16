package com.bda.jobmarket.controller;

import com.bda.jobmarket.model.Application;
import com.bda.jobmarket.model.Job;
import com.bda.jobmarket.model.User;
import com.bda.jobmarket.repository.ApplicationRepository;
import com.bda.jobmarket.repository.JobRepository;
import com.bda.jobmarket.service.UserService;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ApplicationController {
    private final ApplicationRepository apps;
    private final JobRepository jobs;
    private final UserService userService;

    public ApplicationController(ApplicationRepository apps, JobRepository jobs, UserService userService) {
        this.apps = apps; this.jobs = jobs; this.userService = userService;
    }

    @PostMapping("/jobs/{id}/apply")
    public Application apply(@PathVariable String id, Authentication auth) {
        User u = userService.current(auth);
        Job j = jobs.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        if (apps.existsByUserIdAndJobId(u.id(), j.id()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already applied to this job");
        return apps.save(new Application(null, u.id(), j.id(), j.title(), j.company(), "APPLIED", Instant.now()));
    }

    @GetMapping("/me/applications")
    public List<Application> mine(Authentication auth) {
        return apps.findByUserIdOrderByAppliedAtDesc(userService.current(auth).id());
    }
}
