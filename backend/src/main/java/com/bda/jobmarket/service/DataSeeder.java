package com.bda.jobmarket.service;

import com.bda.jobmarket.model.*;
import com.bda.jobmarket.repository.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs at startup: creates indexes, creates the admin account, and (only if the jobs collection is empty)
 * generates a realistic job-postings dataset (default 50,000 jobs, 200 companies).
 */
@Component
public class DataSeeder implements CommandLineRunner {
    record RoleDef(String name, double baseLpa, List<String> skills) {}

    static final List<RoleDef> ROLES = List.of(
        new RoleDef("Java Developer", 12, List.of("Java", "Spring Boot", "SQL", "Microservices", "MongoDB", "Docker", "REST API", "Git", "Kafka", "AWS")),
        new RoleDef("Frontend Developer", 10, List.of("JavaScript", "React", "HTML", "CSS", "TypeScript", "Redux", "Git", "REST API", "Next.js", "Tailwind")),
        new RoleDef("Full Stack Developer", 13, List.of("JavaScript", "React", "Node.js", "MongoDB", "SQL", "REST API", "Git", "Docker", "TypeScript", "Spring Boot")),
        new RoleDef("Data Scientist", 16, List.of("Python", "Machine Learning", "SQL", "Pandas", "Statistics", "TensorFlow", "Scikit-learn", "NLP", "Power BI", "Spark")),
        new RoleDef("Data Engineer", 15, List.of("Python", "SQL", "Spark", "Hadoop", "Kafka", "Airflow", "AWS", "Hive", "ETL", "MongoDB")),
        new RoleDef("Machine Learning Engineer", 18, List.of("Python", "TensorFlow", "PyTorch", "Machine Learning", "Docker", "AWS", "MLOps", "SQL", "Deep Learning", "NLP")),
        new RoleDef("DevOps Engineer", 14, List.of("Docker", "Kubernetes", "AWS", "Jenkins", "Linux", "Terraform", "Git", "Ansible", "Python", "Prometheus")),
        new RoleDef("Android Developer", 11, List.of("Kotlin", "Java", "Android SDK", "Firebase", "REST API", "Git", "MVVM", "Jetpack Compose", "SQL", "Room")),
        new RoleDef("QA Engineer", 8, List.of("Selenium", "Java", "TestNG", "SQL", "Jira", "Postman", "Git", "Python", "Cucumber", "Jenkins")),
        new RoleDef("Business Analyst", 9, List.of("SQL", "Excel", "Power BI", "Tableau", "Jira", "Communication", "Python", "Statistics", "Agile", "Documentation")));

    static final String[] CITIES = {"Bengaluru", "Hyderabad", "Pune", "Mumbai", "Chennai", "Delhi NCR", "Kolkata", "Ahmedabad"};
    static final double[] CITY_MULT = {1.15, 1.05, 1.0, 1.10, 0.95, 1.05, 0.85, 0.85};
    static final String[] LEVELS = {"Entry", "Mid", "Senior"};
    static final double[] LEVEL_MULT = {0.6, 1.0, 1.7};
    static final String[] PREFIX = {"Nova", "Apex", "Blue", "Quantum", "Zen", "Vertex", "Orbit", "Pixel", "Cloud", "Nimbus",
            "Helix", "Fusion", "Spark", "Titan", "Lumen", "Cyber", "Delta", "Echo", "Pulse", "Atlas"};
    static final String[] SUFFIX = {"Technologies", "Systems", "Labs", "Solutions", "Software", "Analytics", "Digital", "Networks", "Soft", "Works"};
    static final String[] INDUSTRY = {"IT Services", "Fintech", "E-commerce", "Healthcare", "Product", "Telecom", "Consulting", "EdTech"};

    private final MongoTemplate mongo;
    private final UserRepository users;
    private final CompanyRepository companies;
    private final PasswordEncoder encoder;
    private final int jobCount;

    public DataSeeder(MongoTemplate mongo, UserRepository users, CompanyRepository companies,
                      PasswordEncoder encoder, @Value("${app.seed.jobs}") int jobCount) {
        this.mongo = mongo; this.users = users; this.companies = companies; this.encoder = encoder; this.jobCount = jobCount;
    }

    @Override
    public void run(String... args) {
        createIndexes();
        if (!users.existsByEmail("admin@jobs.com")) {
            users.save(new User(null, "Admin", "admin@jobs.com", encoder.encode("admin123"), "ADMIN",
                    List.of(), "Bengaluru", Instant.now()));
        }
        if (mongo.getCollection("jobs").countDocuments() == 0) seedJobs();
    }

    private void createIndexes() {
        mongo.indexOps("users").ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
        mongo.indexOps("applications").ensureIndex(new Index().on("userId", Sort.Direction.ASC).on("jobId", Sort.Direction.ASC).unique());
        var jobs = mongo.indexOps("jobs");
        jobs.ensureIndex(new Index().on("skills", Sort.Direction.ASC));   // multikey index on the embedded array
        jobs.ensureIndex(new Index().on("city", Sort.Direction.ASC));
        jobs.ensureIndex(new Index().on("role", Sort.Direction.ASC));
        jobs.ensureIndex(new Index().on("postedAt", Sort.Direction.DESC));
    }

    private void seedJobs() {
        System.out.println("Seeding " + jobCount + " jobs... (first start only)");
        Random r = new Random(42);

        List<Company> comp = new ArrayList<>();
        for (int i = 0; i < 200; i++) {
            comp.add(new Company("c" + i, PREFIX[i % PREFIX.length] + " " + SUFFIX[i / PREFIX.length], INDUSTRY[r.nextInt(INDUSTRY.length)]));
        }
        companies.saveAll(comp);

        List<Job> batch = new ArrayList<>(5000);
        for (int i = 0; i < jobCount; i++) {
            RoleDef rd = ROLES.get(r.nextInt(ROLES.size()));
            int ci = r.nextInt(CITIES.length);
            int roll = r.nextInt(100);
            int li = roll < 35 ? 0 : roll < 80 ? 1 : 2;
            Company c = comp.get(r.nextInt(comp.size()));

            List<String> pool = new ArrayList<>(rd.skills());
            Collections.shuffle(pool, r);
            List<String> skills = new ArrayList<>(pool.subList(0, 4 + r.nextInt(4)));

            double salary = Math.round(rd.baseLpa() * CITY_MULT[ci] * LEVEL_MULT[li] * (0.85 + r.nextDouble() * 0.3) * 10) / 10.0;
            String type = (li == 0 && r.nextInt(100) < 15) ? "Internship" : (r.nextInt(100) < 12 ? "Contract" : "Full-time");
            // more postings in recent months, so the hiring trend chart shows growth
            long daysAgo = (long) (365 * (1 - Math.sqrt(r.nextDouble())));
            Instant posted = Instant.now().minus(daysAgo, ChronoUnit.DAYS).minus(r.nextInt(86_400), ChronoUnit.SECONDS);
            String title = (li == 2 ? "Senior " : li == 0 ? "Junior " : "") + rd.name();
            String desc = c.name() + " is hiring a " + title + " in " + CITIES[ci] + ". Required skills: " + String.join(", ", skills) + ".";

            batch.add(new Job(null, title, rd.name(), c.id(), c.name(), CITIES[ci], skills, salary, LEVELS[li], type, posted, desc));
            if (batch.size() == 5000) { mongo.insert(batch, Job.class); batch.clear(); }
        }
        if (!batch.isEmpty()) mongo.insert(batch, Job.class);
        System.out.println("Seeding finished.");
    }
}
