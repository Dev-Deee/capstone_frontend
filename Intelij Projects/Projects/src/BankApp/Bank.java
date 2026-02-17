package BankApp;

import java.util.ArrayList;
import java.util.List;

public class Bank {
    private String name;
    private List<Account> accounts;
    private static int numberOfAccounts = 0;

    public Bank(String nameOfBank) {
        this.name = nameOfBank;
        this.accounts = new ArrayList<>();
    }

    public String CreateAccount(String name, String pin, String phoneNumber, int age) {
        Account newAccount = new Account(name, phoneNumber, age, pin);

    }


   /* public String getAccount() {
        return accountNumber;
    }

    private void generateAccountNumber(String phoneNumber) {
        validatePhoneNumber(phoneNumber);
        accountNumber = phoneNumber.substring(1);
    }*/


}
