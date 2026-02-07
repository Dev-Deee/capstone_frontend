package dsa;

public class MyStack {
    private int numberOfElements;
    private String []elements;
    private  int capacity;


    public MyStack(int capacity) {
        this.elements = new String[capacity];
        this.capacity = capacity;
        this.numberOfElements = 0;
    }

    public boolean isEmpty() {
        return numberOfElements == 0;
    }

    public void push(String element) {
        if(numberOfElements == capacity) {throw new IllegalArgumentException("cannot add to  a full stack");}
        elements[numberOfElements++] = element;
    }

    public int size() {
            return numberOfElements;
    }

    public String pop() {
        if(isEmpty()) {throw new IllegalArgumentException("cannot pop from empty stack");}
        String result = elements[numberOfElements -1];
        elements[--numberOfElements] = null;
        return result;
    }

    public String peek() {
        if(isEmpty()) {throw new IllegalArgumentException("cannot peek from empty stack");}
        return elements[numberOfElements - 1];
    }
}
