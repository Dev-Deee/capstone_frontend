package dsa;

public class MyStack {
    private int numberOfElements;
    private final String []elements;
    private int capacity;
    private int top;

    public MyStack(int capacity) {
        this.capacity = capacity;
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
        if(isEmpty()) {throw new IllegalArgumentException("cannot pop from empty stack");}
        elements[--numberOfElements] = null;
        return true;
    }

    public String peek() {
        if(isEmpty()) {throw new IllegalArgumentException("cannot peek from empty stack");}
        return elements[numberOfElements - 1];
    }
}
