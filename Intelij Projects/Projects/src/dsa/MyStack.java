package dsa;

public class MyStack {
    private int numberOfElements;
    private final String []elements;

    public MyStack(int capacity) {
//        this.capacity = capacity;
        this.elements = new String[capacity];
        this.numberOfElements = 0;
    }

    public boolean isEmpty() {
        return numberOfElements == 0;
    }

    public boolean push(String element) {
        elements[numberOfElements++] = element;
        return true;
    }

    public int size() {
        return numberOfElements;
    }

    public boolean pop() {
        elements[--numberOfElements] = null;
        return true;
    }
}
