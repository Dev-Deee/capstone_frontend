package BankApp;
public class Account {

    private int balance = 0;
    private int pin;
    private String name;
    private String phoneNumber;
    private int age;
    private String accountNumber;

    public Account(String name, int pin, String phoneNumber, int age, String accountNumber) {
        this.pin = pin;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.age = age;
        setAccount(phoneNumber);
    }

    public int getBalance() {
        return balance;
    }


    public int checkBalance(int userPin) {
        validatePinLength(userPin);
        if (pin == userPin)
            return balance;
        else{
            return 0;
        }
    }

    public void deposit(int amount) {
        if (amount > 0) {
            balance = balance + amount;
        }
    }

    public int withdraw(int amount, int userPin) {
        validatePinLength(userPin);
        if (amount > balance && userPin == pin) {
            return balance;
        }
        else if (amount > 0 && userPin == pin) {
            balance = balance - amount;
        }
        return balance;
    }
    public String getName(){
        return  name;
    }

    public String setName(String name){
        if (name == null || name.isEmpty() || name.length() < 3 || !name.matches("[a-zA-Z ]+")) {
            return "Invalid name";
        }
        return this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        validateAge(age);
        this.age = age;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        validatePhoneNumber(phoneNumber);
        phoneNumber = phoneNumber.trim();
    }

    public String getAccount() {
        return accountNumber;
    }

    public void setAccount(String phoneNumber) {
        validatePhoneNumber(phoneNumber);
        accountNumber = phoneNumber.substring(1);
    }

    private static void validateAge(int age) {
        if (age <= 18 || age >= 100)  {throw new IllegalArgumentException("Invalid Age. Age must be greater than 18");}
    }

    private static void validatePhoneNumber(String phoneNumber) {
        if(phoneNumber.length() != 11){
            throw new IllegalArgumentException("Invalid Phone Number. Phone Number must not be null");
        }
    }

    private void validatePinLength(int userPin) {
        if(userPin <= 999 || userPin > 9999){
            throw new IllegalArgumentException("Invalid Phone Number. Phone Number must not be null");
        }
    }


}
