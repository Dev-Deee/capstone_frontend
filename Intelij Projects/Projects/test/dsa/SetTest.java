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
    public void testThatAddTwoSimilar_SetKeepsOneElement() {
        assertTrue(string.isEmpty());
        string.add("Garri");
        string.add("Epa");

    }



}





/*

        add
size
                remove
contain
                        clear*/
