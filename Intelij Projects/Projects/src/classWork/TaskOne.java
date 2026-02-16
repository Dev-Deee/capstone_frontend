package classWork;

public class TaskOne {
    static void main() {

        int [] myArray = {6, 8, 12};
        int  number = 6;
        int value = 12;

        System.out.println(highestDivisor(myArray));

    }
    public static int highestDivisor(int[] number) {
        int result = number[0];
        for(int index = 1; index < number.length; index++) {
            result = gcd(result, number[index]);
        }
        return result;
    }
    private static int gcd(int number, int value) {
        while(value != 0) {
            int temp = value;
            value = value % number;
            number = temp;
        }
        return number;
    }
}
