package com.capstone_project.capstone_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping(path = "/")
public class LandingController {

    @GetMapping
    public String landingPage() {
        return "landing-page";
    }

}
