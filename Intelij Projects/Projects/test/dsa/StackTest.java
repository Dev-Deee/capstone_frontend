package dsa;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class StackTest {
    MyStack string;
    @BeforeEach
    public void StartWithThisTest() {
        string = new MyStack(5);
    }
    @Test
    public void testThatStackIsEmpty() {
        assertTrue(string.isEmpty());
    }

    @Test
    public void testThatStackPushOne_StackIsNotEmpty() {
        assertTrue(string.isEmpty());
        assertTrue(string.push("Hello"));
        assertFalse(string.isEmpty());
        assertEquals(1, string.size());
    }

    @Test
    public void testThatStackPushOne_PopOneStackIsEmpty() {
        assertTrue(string.isEmpty());
        assertTrue(string.push("Hello"));
        assertTrue(string.pop());
        assertTrue(string.isEmpty());
        assertEquals(0, string.size());
    }

    @Test
    public void testThatStackPushTwo_PopOneStackIsNotEmpty() {
        assertTrue(string.isEmpty());
        assertTrue(string.push("Hello"));
        assertTrue(string.push("Hello"));
        assertTrue(string.pop());
        assertFalse(string.isEmpty());
        assertEquals(1, string.size());
    }

    @Test
    public void testThatStackPushOne_ElementInStackIsOnTop() {
        assertTrue(string.isEmpty());
        assertTrue(string.push("Hello"));



    }





}
