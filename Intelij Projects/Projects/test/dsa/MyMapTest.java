package dsa;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
    public class MyMapTest {
        MyMap mapClass;
        @BeforeEach
        public void startApp(){
            mapClass = new MyMap(3);
        }
        @Test
        public void testThe_sizeOfMapIs_isEmpty(){
            int mapSize = mapClass.size();
            assertEquals(0, mapSize);
        }

        @Test
        public void testThat_mapIsEmpty(){
            assertEquals(0,mapClass.size());
            assertTrue(mapClass.isEmpty());
        }


        @Test
        public void testThat_mapReturnsAValue_toWhichItWasMapped(){
            assertEquals(0,mapClass.size());
            mapClass.put("firstFruit","apple");
            assertEquals("apple",mapClass.get("firstFruit"));
        }



        @Test
        public void testThat_mapReturnsNull_whenNoMappingForKey(){
            assertEquals(0,mapClass.size());
            assertNull(mapClass.get("eleventhFruit"));
        }

        @Test
        public void testThat_iCanAddElement_toTheMap(){
            assertEquals(0,mapClass.size());
            String value = mapClass.put("firstFruit","apple");
            assertEquals("apple",value);
        }

        @Test
        public void testThat_iCanTheValueOfAnExistingKey(){
            assertEquals(0,mapClass.size());
            mapClass.put("firstFruit","apple");
            mapClass.put("firstFruit","pineapple");
            assertEquals("pineapple",mapClass.get("firstFruit"));
        }

        @Test
        public void testThat_iCanRemove_keyPair(){
            assertEquals(0,mapClass.size());
            mapClass.put("firstFruit","apple");
            mapClass.put("secondFruit","pineapple");
            assertEquals(2,mapClass.size());
            String removedValued = mapClass.remove("firstFruit");
            assertEquals("apple",removedValued);
        }

        @Test
        public void testThat_nullIsReturnedWhen_keyNotFound(){
            assertEquals(0,mapClass.size());
            mapClass.put("firstFruit","apple");
            mapClass.put("secondFruit","pineapple");
            assertEquals(2,mapClass.size());
            assertNull(mapClass.remove("fifthFruit"));
        }

        @Test
        public void testThat_mapContains_value(){
            assertEquals(0,mapClass.size());
            mapClass.put("firstFruit","apple");
            mapClass.put("secondFruit", "pineapple");
            assertEquals(2,mapClass.size());
            assertTrue(mapClass.containsValue("apple"));
        }

        @Test
        public void testThat_mapContains_key(){
            assertEquals(0,mapClass.size());
            mapClass.put("firstFruit","apple");
            mapClass.put("secondFruit","pineapple");
            assertEquals(2,mapClass.size());
            assertTrue(mapClass.containsKey("firstFruit"));
        }

        @Test
        public void testThat_iCanClearMy_map(){
            assertEquals(0,mapClass.size());
            mapClass.put("firstFruit","apple");
            mapClass.put("secondFruit","pineapple");
            assertEquals(2,mapClass.size());
            mapClass.clear();
            assertEquals(0,mapClass.size());
        }
        @Test
        public void testThat_whenIClear_mapIsEmpty(){
            assertEquals(0, mapClass.size());
            mapClass.put("firstFruit","apple");
            mapClass.put("secondFruit","pineapple");
            assertEquals(2,mapClass.size());
            mapClass.clear();
            assertTrue(mapClass.isEmpty());
        }
    }