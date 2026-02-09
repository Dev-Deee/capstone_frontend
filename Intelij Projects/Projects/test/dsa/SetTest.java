package dsa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;


public class SetTest {
    MySet string;
    @BeforeEach
    public void StartWithThisTest(){
        string = new MySet(5);
    }

    @Test
    public void testThatSetIsEmpty() {
        assertTrue(string.isEmpty());
    }

    @Test
    public void testThatSetAddOne_SetIsNotEmpty() {
        assertTrue(string.isEmpty());
        string.add("Garri");
        assertFalse(string.isEmpty());
    }

    @Test
    public void testThatSetAddEmpty_ThrowsException() {
        assertTrue(string.isEmpty());
        string.add("K");
        string.add("Garri");
        string.add("Epa");
        string.add("Boole");
        string.add("Rice");
        assertThrows(IllegalArgumentException.class, () -> string.add("Beans"));
    }

    @Test
    public void testThatAddTwoSimilar_CheckIfItExistsInSet() {
        assertTrue(string.isEmpty());
        string.add("Garri");
        string.add("1");
        string.add("2");
        string.add("Garri");
        assertEquals(3, string.size());

    }

    @Test
    public void testThatAddTwoSimilar_StoreOneInSet() {
        assertTrue(string.isEmpty());
        string.add("Garri");
        string.add("Rice");
        string.add("Boole");
        assertFalse(string.contains("Amala"));
        assertFalse(string.contains("Beans"));
        assertTrue(string.contains("Garri"));
        assertEquals(3, string.size());
    }

    @Test
    public void testThat_CLear_WipesElementFromSet() {
        assertTrue(string.isEmpty());
        string.add("Garri");
        string.add("Beans");
        string.add("Rice");
        string.add("Boole");
        string.add("Amala");
        assertEquals(5, string.size());
        string.clear();
        assertTrue(string.isEmpty());
    }

    @Test
    public void testThat_SetRemove_ElementFromSet(){
        assertTrue(string.isEmpty());
        string.add("Garri");
        string.add("Rice");
        string.add("Boole");
        string.add("Amala");
        assertEquals(4, string.size());
        assertTrue(string.remove("Amala"));
        assertTrue(string.remove("Boole"));
        assertEquals(2, string.size());
    }

    @Test
    public void testThatCLear_RemovesElementFromSet() {
        assertTrue(string.isEmpty());
        assertThrows(IllegalArgumentException.class, () -> string.remove("Boole"));
    }

    @Test
    public void testThatSetAddThree_RemoveOne() {
        string.add("A");
        string.add("B");
        string.add("C");

        string.remove("B");

        assertEquals(2, string.size());
        assertTrue(string.contains("A"));
        assertFalse(string.contains("B"));
        assertTrue(string.contains("C"));
    }

    @Test
    public void testRemove_ElementExists() {
        string.add("Plantain");
        assertTrue(string.remove("Plantain"));
        assertEquals(0, string.size());
        assertFalse(string.contains("Plantain"));
    }

    @Test
    public void testRemove_ElementDoesNotExist() {
        string.add("Yam");
        assertFalse(string.remove("Potato"));
        assertEquals(1, string.size());
    }

    @Test
    public void testToArray() {
        string.add("X");
        string.add("Y");
        string.add("Z");
        assertEquals(3, string.toArray().length);
        assertTrue(string.contains("X"));
        assertTrue(string.contains("Y"));
        assertTrue(string.contains("Z"));
    }

    @Test
    public void testToArray_EmptySet() {
        String[] array = string.toArray();
        assertEquals(0, array.length);
    }
    
}
