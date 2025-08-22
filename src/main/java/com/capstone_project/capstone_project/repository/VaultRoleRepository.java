package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.VaultRole;
import org.springframework.data.repository.CrudRepository;

public interface VaultRoleRepository extends CrudRepository<VaultRole, Integer> {
    VaultRole findByName(String name);
}
