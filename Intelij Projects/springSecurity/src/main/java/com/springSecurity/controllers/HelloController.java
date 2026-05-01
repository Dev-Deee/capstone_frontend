package com.springSecurity.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/")
    public String greeting(HttpServletRequest request) {
        return "Greetings from Spring Boot!\n\n" + request.getSession().getId();
    }
}
