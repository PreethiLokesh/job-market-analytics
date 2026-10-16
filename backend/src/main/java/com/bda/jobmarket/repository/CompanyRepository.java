package com.bda.jobmarket.repository;

import com.bda.jobmarket.model.Company;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CompanyRepository extends MongoRepository<Company, String> {
    Optional<Company> findByName(String name);
}
