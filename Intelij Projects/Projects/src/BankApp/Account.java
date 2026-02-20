package BankApp;
public class Account {
    private double balance = 0.0;
    private String pinCode;
    private String name;
    private String phoneNumber;
    private int age;
    private String accountNumber;

    public Account(String name, String pin, String phoneNumber, int age) {
        setName(name);
        setPin(pin);
        setPhoneNumber(phoneNumber);
        setAge(age);
    }

    public double getBalance() {
        return balance;
    }

    public String setAccountNumber(String accountNumber) {
        validateAccountNumber(accountNumber);
        return this.accountNumber = accountNumber;
    }

    public double checkBalance(String userPin) {
        validatePinLength(userPin);
        if (pinCode.equalsIgnoreCase(userPin))
            return balance;
        else{
            throw new IllegalArgumentException("Invalid Age. Age must be greater than 18");

        }
    }

    public void deposit(double amount) {
        if (amount > 0) {
            this.balance = balance + amount;
        }
    }

    public double withdraw(double amount, String userPin) {
        validateWithdraw(amount, userPin);
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

    public String getAccount() {
        return accountNumber;
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
        if (phoneNumber == null || phoneNumber.trim().isEmpty() || !phoneNumber.matches("\\d{11}")){
            throw new IllegalArgumentException("Invalid Phone Number. Phone number must be exactly 11 digits");
        }
    }

    private void validatePinLength(String userPin) {
        if (userPin == null || userPin.isEmpty() || !userPin.matches("\\d{4}")){
            throw new IllegalArgumentException("Invalid Phone Number. Pin must be exactly 4 digits");
        }
    }

    private static void validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
    }

    private static void validateAccountNumber(String accountNumber) {
        if (accountNumber == null || !accountNumber.matches("\\d{10}")) {
            throw new IllegalArgumentException("Invalid Account Number. Account number must be exactly 10 digits");
        }
    }
    private void validatePin(String userPin) {
        if (!userPin.equalsIgnoreCase(pinCode))
            throw new IllegalArgumentException("Incorrect pin");
    }

    private void validateNegativeAmount(double amount) {
        if (amount <= 0)
            throw new IllegalArgumentException("Amount must be greater than 0");
        if (amount > balance)
            throw new IllegalArgumentException("Insufficient funds");
    }

    private void validateWithdraw(double amount, String userPin) {
        validatePinLength(userPin);
        validatePin(userPin);
        validateNegativeAmount(amount);
    }
}
