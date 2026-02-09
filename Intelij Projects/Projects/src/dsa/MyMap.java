package dsa;

public class MyMap {
    private String[] storage;
    private String[] keys;
    private int noOfElement;

    MyMap(int capacity){
        storage = new String[capacity];
        keys = new String[capacity];
    }
    public int size() {
        return noOfElement;
    }

    public boolean isEmpty() {
        return size()==0;
    }

    public boolean containsKey(String key) {
        for (String element : keys){
            return element.equals(key);
        }
        return false;
    }

    public boolean containsValue(String value) {
        for(String element : storage){
            return element.equals(value);
        }
        return false;
    }

    public String get(String key) {
        for (int count = 0; count < size(); count++) {
            if (keys[count] == null && key == null) {
                return storage[count];
            }
            if (keys[count] != null && keys[count].equals(key)) {
                return storage[count];
            }
        }
        return null;
    }

    public String put(String key,String value) {
        for (int count = 0; count < size(); count++) {
            if (keys[count] != null && keys[count].equals(key)) {
                storage[count] = value;
                return value;
            }
        }
        keys[noOfElement] = key;
        storage[noOfElement] = value;
        noOfElement++;

        return value;
    }

    public String remove(String key) {
        String value = null;
        for(int count = 0;count<size();count++){
            if(keys[count].equals(key)){
                value=storage[count];
                keys[count] = null;
                storage[count] = null;
                noOfElement--;
            }
        }
        return value;
    }

    public void clear() {
        noOfElement = 0;
    }
}
