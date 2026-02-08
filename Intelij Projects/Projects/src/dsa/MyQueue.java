package dsa;

public class MyQueue {
    private  int numberOfElements;
    private String[] elements;
    private int capacity;
    private int frontPosition;
    private int rearPosition;

    public MyQueue(int capacity) {
        this.elements = new String[capacity];
        this.numberOfElements = 0;
        this.capacity = capacity;
        this.frontPosition = 0;
        this.rearPosition = 0;
    }

    public boolean isEmpty() {
        return numberOfElements == 0;
    }

    public boolean add(String element) {
        if(numberOfElements == capacity) {throw new IllegalArgumentException("Queue is full");}
        elements[rearPosition] = element;
        rearPosition = (rearPosition + 1) % capacity;  // Circular increment
        numberOfElements++;
        return true;
    }

    public int size() {
        return numberOfElements;
    }

    public String remove() {
        if(isEmpty()) {throw new IllegalArgumentException("cannot remove from empty stack");}
        String result = elements[frontPosition];
        elements[frontPosition] = null;
        frontPosition = (frontPosition + 1) % capacity;
        numberOfElements--;
        return result;
    }

    public String peek() {
        if(isEmpty()) {throw new IllegalArgumentException("cannot peek from empty stack");}
        return elements[frontPosition];
    }

    public boolean offer(String element) {
        if(numberOfElements == capacity){throw new IllegalArgumentException("Cannot offer to full queue");}
        elements[rearPosition] = element;
        rearPosition = (rearPosition + 1) % capacity;
        numberOfElements++;
        return true;
    }


}
