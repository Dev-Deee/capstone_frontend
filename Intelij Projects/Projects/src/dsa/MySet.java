package dsa;

public class MySet {
    private int numberOfElements;
    private String[] elements;
    private int capacity;

    public MySet(int capacity) {
        this.numberOfElements = 0;
        this.capacity = capacity;
        this.elements = new String[capacity];

    }

    public boolean isEmpty() {
        return numberOfElements == 0;
    }

    public boolean add(String element) {
        if(numberOfElements == capacity) {throw new IllegalArgumentException("Cannot add null element");}
        elements[numberOfElements++] = element;
        return true;
    }
}
