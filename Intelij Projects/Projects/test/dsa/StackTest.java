package dsa;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

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
        string.push("Hello");
        assertFalse(string.isEmpty());
        assertEquals(1, string.size());
    }

    @Test
    public void testThatStackPushOneElement_PopOneElement_StackIsEmpty() {
        assertTrue(string.isEmpty());
        string.push("Hello");
        string.pop();
        string.isEmpty();
        assertEquals(0, string.size());
    }

    @Test
    public void testThatStackPushTwoElement_PopOneElement_StackIsNotEmpty() {
        assertTrue(string.isEmpty());
        string.push("Hello");
        string.push("Hello");
        string.pop();
        assertFalse(string.isEmpty());
        assertEquals(1, string.size());
    }

    @Test
    public void testThatStackPushOne_ElementInStackIsOnTop() {
        assertTrue(string.isEmpty());
        string.push("Hello");
        string.push("Dayo");
        assertEquals("Dayo", string.peek());
    }

    @Test
    public void testThatMyStackAddToCapacity() {
        assertTrue(string.isEmpty());
        string.push("1");
        string.push("2");
        string.push("3");
        string.push("4");
        string.push("5");
        assertEquals(5, string.size());
        assertFalse(string.isEmpty());
        assertEquals(5, string.size());
    }

    @Test
    public void testThatMyStackAddAboveCapacity_ThrowsException() {
        assertTrue(string.isEmpty());
        string.push("1");
        string.push("2");
        string.push("3");
        string.push("4");
        string.push("5");
        assertFalse(string.isEmpty());
        assertThrows(IllegalArgumentException.class, () -> string.push("6"));

    }

    @Test
    public void testThatStackPopEmpty_throwsException() {
        assertTrue(string.isEmpty());
        assertThrows(IllegalArgumentException.class, () -> string.pop());
    }

    @Test
    public void testThatStackPeekEmpty_throwsException() {
        assertTrue(string.isEmpty());
        assertThrows(IllegalArgumentException.class, () -> string.peek());
    }

    @Test
    public void testThatStackPushXY_PopXY_ReturnsY() {
        assertTrue(string.isEmpty());
        string.push("Hello");
        string.push("Dayo");
        assertEquals("Dayo", string.pop());
        assertEquals("Hello", string.pop());
        assertTrue(string.isEmpty());
    }

    @Test
    public void testThatPushXYZ_PopXYZ(){
        assertTrue(string.isEmpty());
        string.push("Hello");
        string.push("Dayo");
        string.push("Home");
        assertEquals("Home", string.pop());
        assertEquals("Dayo", string.pop());
        assertEquals("Hello", string.pop());
        assertTrue(string.isEmpty());
    }




}
