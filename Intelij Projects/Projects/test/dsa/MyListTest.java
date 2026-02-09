package dsa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class MyListTest {
    MyList stringList;
    @BeforeEach
    public void startWithThis(){
        stringList= new MyList();
    }

    @Test
    public void testIsEmptyWork(){
        assertTrue(stringList.isEmpty());
    }

    @Test
    public void testSize_ReturnNumberOfElementsInTheList(){
        assertEquals(0,stringList.size());
    }

    @Test
    public void testClear_MakesSizeEqualToZero(){
        assertEquals(0,stringList.size());
        stringList.add("G-String");
        stringList.add("Queue");
        stringList.add("Fish-Pie");
        assertEquals(3,stringList.size());
        stringList.clear();
        assertEquals(0,stringList.size());
    }

    @Test
    public void testThatAddIncreasesTheSizeOTheList(){
        assertEquals(0,stringList.size());
        stringList.add("G-String");
        stringList.add("Queue");
        stringList.add("Fish-Pie");
        stringList.add("Fowl");
        assertEquals(4,stringList.size());
        stringList.add(1,"Goat");
        assertEquals(5,stringList.size());
    }

    @Test
    public void tsetLastIndexOf_ReturnsTheCorrectValue(){
        stringList.add("Bed-Bug");
        stringList.add("Bed-Bug");
        stringList.add("Bed-Bug");
        stringList.add("1234");
        assertEquals(2,stringList.lastIndexOf("Bed-Bug"));
    }

    @Test
    public void testLastIndexOfReturns_NegativeValueIfElementIsNotFound(){
        stringList.add("Bed-Bug");
        stringList.add("Bolu");
        stringList.add("Papa");
        stringList.add("1234");
        assertEquals(-1,stringList.lastIndexOf("Fish"));
    }

    @Test
    public void testAddMethodOverloadingWorks(){
        stringList.add(("Pascal"));
        stringList.add(1,"Fish-Pie");
        assertEquals(2,stringList.size());
    }

    @Test
    public void testThatIndexMethod_ReturnsTheFirstOccurrenceOfElement(){
        stringList.add(("Pascal"));
        stringList.add(1,"Fish-Pie");
        stringList.add("Bolu");
        stringList.add("Papa");
        stringList.add("Bolu");
        assertEquals(2,stringList.indexOf("Bolu"));
    }

    @Test
    public void testThatIndexMethod_ReturnsNegativeValueIfElementDoesNotExist(){
        stringList.add(("Pascal"));
        stringList.add(1,"Fish-Pie");
        stringList.add("Bolu");
        stringList.add("Papa");
        stringList.add("Bolu");
        assertEquals(-1,stringList.indexOf("olu"));
    }

    @Test
    public void testThat_ReturnTheCorrectElement(){
        stringList.add("Fish");
        stringList.add("Mango");
        stringList.add("Goat");
        stringList.add("Meat-Pie");
        assertEquals("Goat",stringList.remove(2));
    }

    @Test
    public void testThatIfRemoveSizeReduces(){
        assertEquals(0,stringList.size());
        stringList.add("Fish");
        stringList.add("Mango");
        stringList.add("Goat");
        stringList.add("Meat-Pie");
        assertEquals(4,stringList.size());
        stringList.remove(0);
        stringList.remove(2);
        assertEquals(2,stringList.size());
    }

    @Test
    public void testThatSetReturns_TheCorrectValue(){
        stringList.add("Dog");
        stringList.add("Mango");
        stringList.add("Orange");
        stringList.add("Meat-Pie");
        assertEquals("Dog",stringList.set(0,"12345"));
    }

    @Test
    public void testThatRemoveMoreThanSize_ThrowsException(){
        assertEquals(0,stringList.size());
        stringList.add("Fish");
        stringList.add("Mango");
        stringList.add("Goat");
        stringList.add("Meat-Pie");
        assertEquals(4,stringList.size());
        assertThrows(IndexOutOfBoundsException.class, () -> stringList.remove(5));
    }

    @Test
    public void testGetReturns_CorrectValue(){
        stringList.add("Fish");
        stringList.add("Mango");
        stringList.add("Always");
        assertEquals("Fish", stringList.get(0));
    }

    @Test
    public void testThatSetUpdateTheList(){
        stringList.add("Fish");
        stringList.add("Mango");
        stringList.add("Always");
        stringList.set(1,"Goat");
        assertEquals("Goat",stringList.get(1));
    }
}