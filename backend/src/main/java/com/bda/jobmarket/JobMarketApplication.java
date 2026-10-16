package com.bda.jobmarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class JobMarketApplication {
    public static void main(String[] args) {
        SpringApplication.run(JobMarketApplication.class, args);
    }
}
