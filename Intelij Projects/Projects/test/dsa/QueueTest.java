package dsa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class QueueTest {
    MyQueue stringElement;
    @BeforeEach
    public void StartWithThisTest() {
        stringElement = new MyQueue(5);
    }
    @Test
    public void testThatMyQueueIsEmpty() {
        assertTrue(stringElement.isEmpty());
    }
    @Test
    public void testThatMyQueueAddOneElement_MyQueueIsNotEmpty() {
        assertTrue(stringElement.isEmpty());
        stringElement.add("Amala");
        assertFalse(stringElement.isEmpty());
        assertEquals(1, stringElement.size());
    }
    @Test
    public void testThatMyQueueAddTwoElement_RemoveOneElement_MyQueueIsNotEmpty() {
        assertTrue(stringElement.isEmpty());
        stringElement.add("Amala");
        stringElement.add("Rice");
        stringElement.remove();
        assertFalse(stringElement.isEmpty());
        assertEquals(1, stringElement.size());
    }

    @Test
    public void testThatMyQueueAddThreeElement_RemoveTwoElement_MyQueueIsNotEmpty() {
        assertTrue(stringElement.isEmpty());
        stringElement.add("Amala");
        stringElement.add("Rice");
        stringElement.add("Beans");
        stringElement.remove();
        assertFalse(stringElement.isEmpty());
        assertEquals(2, stringElement.size());
    }

    @Test
    public void testThatMyQueueAddTwoElement_RemoveTwoElement_MyQueueIsEmpty() {
        assertTrue(stringElement.isEmpty());
        stringElement.add("Amala");
        stringElement.add("Rice");
        stringElement.remove();
        stringElement.remove();
        assertTrue(stringElement.isEmpty());
        assertEquals(0, stringElement.size());
    }

    @Test
    public void testThatRemoveThreeElement_MyQueueIsNotEmpty() {
        assertTrue(stringElement.isEmpty());
        assertThrows(IllegalArgumentException.class, () -> stringElement.remove());
        assertTrue(stringElement.isEmpty());
        assertEquals(0, stringElement.size());
    }

    @Test
    public void testThatMyQueueAddToCapacity() {
        assertTrue(stringElement.isEmpty());
        stringElement.add("1");
        stringElement.add("2");
        stringElement.add("3");
        stringElement.add("4");
        stringElement.add("5");
        assertFalse(stringElement.isEmpty());
        assertEquals(5, stringElement.size());
    }

    @Test
    public void testThatMyStackAddAboveCapacity_ThrowsException(){
        assertTrue(stringElement.isEmpty());
        stringElement.add("1");
        stringElement.add("2");
        stringElement.add("3");
        stringElement.add("4");
        stringElement.add("5");
        assertFalse(stringElement.isEmpty());
        assertThrows(IllegalArgumentException.class, () -> stringElement.add("6"));
    }
    @Test
    public void testThatQueuePeekEmpty_throwsException() {
        assertTrue(stringElement.isEmpty());
        assertThrows(IllegalArgumentException.class, () -> stringElement.peek());
    }

    @Test
    public void testThatQueuePeek_returnsElement() {
        assertTrue(stringElement.isEmpty());
        stringElement.add("Boole");
        stringElement.add("Kokoro");
        assertEquals("Boole", stringElement.peek());
        assertEquals(2, stringElement.size());
    }

    @Test
    public void testOffer_FullQueue_ThrowsException(){
        assertTrue(stringElement.isEmpty());
        stringElement.add("1");
        stringElement.add("2");
        stringElement.add("3");
        stringElement.add("4");
        stringElement.add("5");
        assertEquals(5, stringElement.size());
        assertThrows(IllegalArgumentException.class, () -> stringElement.offer("6"));
    }

    @Test
    public void testThatQueue_FollowsFIFO_Order() {
        stringElement.add("Apple");
        stringElement.add("Bread");
        stringElement.add("Yam");
        assertEquals("Apple", stringElement.remove());
        assertEquals("Bread", stringElement.remove());
        assertEquals("Yam", stringElement.remove());
    }

    @Test
    public void testCircularBehavior() {
        stringElement.add("A");
        stringElement.add("B");
        stringElement.add("C");
        stringElement.remove();
        stringElement.remove();
        stringElement.add("D");
        stringElement.add("E");
        stringElement.add("F");
        assertEquals("C", stringElement.remove());
        assertEquals("D", stringElement.remove());
        assertEquals("E", stringElement.remove());
        assertEquals("F", stringElement.remove());
    }

}
