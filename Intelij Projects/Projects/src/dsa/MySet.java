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
        if (numberOfElements == capacity) {throw new IllegalArgumentException("Cannot add to a empty set");}
        if (contains(element)) {
            return false;
        }
        elements[numberOfElements++] = element;
        return true;
    }

    public boolean contains(String element) {
        for (int count = 0; count < numberOfElements; count++) {
            if (elements[count].equals(element)) {
                return true;
            }
        }
        return false;
    }

    public int size() {
        return numberOfElements;
    }

    public void clear() {
        for (int index = 0; index < numberOfElements; index++) {
            elements[index] = null;
        }
        numberOfElements = 0;
    }


    public boolean remove(String element) {
        if (isEmpty()) {throw new IllegalArgumentException("cannot remove from empty set");}
        for (int index = 0; index < numberOfElements; index++) {
            if (elements[index].equals(element)) {
                for (int count = index; count < numberOfElements - 1; count++) {
                    elements[count] = elements[count + 1];
                }
                elements[--numberOfElements] = null;
                return true;
            }
        }
        return false;
    }

    public String[] toArray() {
        String[] result = new String[numberOfElements];
        for (int count = 0; count < numberOfElements; count++) {
            result[count] = elements[count];
        }
        return result;
    }
}
