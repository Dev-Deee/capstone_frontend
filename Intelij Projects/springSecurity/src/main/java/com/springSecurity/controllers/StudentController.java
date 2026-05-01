package com.springSecurity.controllers;

import com.springSecurity.model.data.Student;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class StudentController {

    private List<Student> students = new ArrayList<>(List.of(
            new Student(1, "Dayo", 60),
            new Student(2, "love", 70),
            new Student(3, "Bro", 65)
    ));

    @GetMapping("/students")
    public List<Student> getStudents(){
        return students;
    }
}
