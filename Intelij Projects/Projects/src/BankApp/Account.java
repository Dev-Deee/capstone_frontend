package BankApp;
public class Account {
    private int balance = 0;
    private String pinCode;
    private String name;
    private String phoneNumber;
    private int age;
//    private String accountNumber;

    public Account(String name, String pin, String phoneNumber, int age, String accountNumber) {
        this.pinCode = pin;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.age = age;
//        generateAccountNumber(phoneNumber);
    }

    public int getBalance() {
        return balance;
    }


    public int checkBalance(String userPin) {
        validatePinLength(userPin);
        if (pinCode.equalsIgnoreCase(userPin))
            return balance;
        else{
            throw new IllegalArgumentException("Invalid Age. Age must be greater than 18");

        }
    }

    public void deposit(int amount) {
        if (amount > 0) {
            this.balance = balance + amount;
        }
    }

    public int withdraw(int amount, String userPin) {
        validatePinLength(userPin);
        validatePin(userPin);
        validateNegativeAmount(amount);
        this.balance = balance - amount;
        return balance;
    }

    public String getName(){
        return  name;
    }

    public String setName(String name){
        validateName(name);
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
        this.phoneNumber = phoneNumber.trim();
    }
    public String getPin() {
        return pinCode;
    }

    public void setPin(String pin) {
        validatePinLength(pin);
        this.pinCode = pin;
    }

    private static void validateAge(int age) {
        if (age <= 18 || age >= 100)  {throw new IllegalArgumentException("Invalid Age. Age must be between 18 and 100");}
    }

    private static void validatePhoneNumber(String phoneNumber) {
        if(phoneNumber == null || phoneNumber.trim().isEmpty() || phoneNumber.length() != 11){
            throw new IllegalArgumentException("Invalid Phone Number. Phone number must be exactly 11 digits");
        }
    }

    private void validatePinLength(String userPin) {
        if (userPin == null || userPin.isEmpty() || !userPin.matches("\\d{4}")){
            throw new IllegalArgumentException("Invalid Phone Number. Pin must be exactly 4 digits");
        }
    }

    private static void validateName(String name) {
        if(name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
    }
    private void validatePin(String userPin) {
        if (!userPin.equalsIgnoreCase(pinCode))
            throw new IllegalArgumentException("Incorrect pin");
    }

    private void validateNegativeAmount(int amount) {
        if (amount <= 0)
            throw new IllegalArgumentException("Amount must be greater than 0");
        if (amount > balance)
            throw new IllegalArgumentException("Insufficient funds");
    }


}
