package com.bda.jobmarket.controller;

import com.bda.jobmarket.service.AnalyticsService;
import com.bda.jobmarket.service.SkillCatalog;
import java.util.List;
import java.util.Map;
import org.bson.Document;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AnalyticsController {
    private final AnalyticsService analytics;
    private final SkillCatalog catalog;

    public AnalyticsController(AnalyticsService analytics, SkillCatalog catalog) {
        this.analytics = analytics; this.catalog = catalog;
    }

    @GetMapping("/analytics/overview")
    public Map<String, Object> overview() { return analytics.overview(); }

    @GetMapping("/analytics/top-skills")
    public List<Document> topSkills(@RequestParam(defaultValue = "15") int limit) { return analytics.topSkills(limit); }

    /** by=role | city ; optional city filter */
    @GetMapping("/analytics/salary")
    public List<Document> salary(@RequestParam(defaultValue = "role") String by, @RequestParam(required = false) String city) {
        return analytics.salary(by, city);
    }

    @GetMapping("/analytics/hiring-trend")
    public List<Document> trend() { return analytics.hiringTrend(); }

    @GetMapping("/analytics/top-companies")
    public List<Document> companies(@RequestParam(defaultValue = "10") int limit) { return analytics.topCompanies(limit); }

    /** Dropdown data for the frontend: cities, roles, all skills. */
    @GetMapping("/meta")
    public Map<String, Object> meta() { return analytics.meta(catalog); }
}
