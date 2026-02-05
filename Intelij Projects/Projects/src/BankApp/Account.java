package BankApp;
public class Account {

    private int balance;
    private int pin;

    Account(int pin) {
        this.pin = pin;
    }

    public int checkBalance(int userPin) {
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
        if (amount > balance && userPin == pin) {
            return balance;
        }
        else if (amount > 0 && userPin == pin) {
            balance = balance - amount;
        }
        return balance;
    }

}
