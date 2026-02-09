package dsa;

public class MyList {
    private int noOfElements;
    private String [] listElements;
    private int capacity = 100;

    MyList(){this.listElements= new String[capacity];}

    public boolean isEmpty() {
        return noOfElements == 0;
    }

    public int size() {
        return noOfElements;
    }

    public boolean add(String element) {
        if (capacity == size()) {throw new IllegalStateException("List is Full");}
        listElements[noOfElements]= element;
        noOfElements++;
        return true;
    }

    public void add(int index, String element){
        if ((index < 0 || index > size())){throw new IndexOutOfBoundsException("Index is out of Range");}
        for(int position =size(); position> index;position--){
            listElements[position] =  listElements[position-1];
        }
        listElements[index]= element;
        noOfElements++;
    }

    public int lastIndexOf (String element){
        for (int count =size()-1; count >= 0; count --){
            if (listElements[count].equalsIgnoreCase(element)){
                return count;
            }
        }
        return -1;
    }

    public int indexOf (String element){
        for (int count =0; count < size(); count ++){
            if (listElements[count].equalsIgnoreCase(element)){
                return count;
            }
        }
        return -1;
    }

    public void clear() {
        for(int count =0; count <size(); count++){
            listElements[count] = null;
        }
        noOfElements=0;
    }

    public String remove (int index){
        if (index < 0 || index >= size()){throw new IndexOutOfBoundsException("Index is Out of Range, Enter an index with the Size.");}
        String temp = listElements[index];
        for(int count =index; count < size()-1; count ++){
            listElements[count]= listElements[count+1];
        }
        listElements[noOfElements - 1] = null;
        noOfElements--;
        return temp;
    }

    public String get (int index){
        if  (index < 0 || index >= size()){throw new IndexOutOfBoundsException("Index out of bound");}
        return listElements[index];
    }

    public String set(int index ,String element){
        if (index < 0 || index >= size()){
            throw new IndexOutOfBoundsException("Index Out of Range");
        }
        String temp = listElements[index];
        listElements[index] = element;
        return temp;
    }
}