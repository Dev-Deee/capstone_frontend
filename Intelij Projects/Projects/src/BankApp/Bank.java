package BankApp;

import java.util.ArrayList;
import java.util.List;

public class Bank {
    private String bankName;
    private List<Account> accounts;

    public Bank(String nameOfBank) {
        this.bankName = nameOfBank;
        this.accounts = new ArrayList<>();
    }

    public void createAccount(String name, String userPin, String phoneNumber, int age) {
        String accountNumber = generateAccountNumber(phoneNumber);
        ensureAccountNumberAvailable(accountNumber);
        Account newAccount = new Account(name, userPin, phoneNumber, age);
        newAccount.setAccountNumber(accountNumber);
        accounts.add(newAccount);
    }

    public int getNumberOfAccounts() {
        return accounts.size();
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }
    
    public List<Account> getAccounts() {
        return accounts;
    }

    public Account findAccountWithAccountNumber(String accountNumber) {
        for(Account account : accounts) {
            if(account.getAccount().equalsIgnoreCase(accountNumber)){
                return account;
            }
        }
        throw new IllegalArgumentException("No account with account number " + accountNumber + " was found");
    }

    private String generateAccountNumber(String phoneNumber) {
        validatePhoneNumber(phoneNumber);
        return phoneNumber.substring(1);
    }

    private void ensureAccountNumberAvailable(String accountNumber) {
        for (Account account : accounts) {
            if (account.getAccount().equals(accountNumber)) {
                throw new IllegalArgumentException("Account number already exists: " + accountNumber);
            }
        }
    }

    private static void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty() || !phoneNumber.matches("\\d{11}") || !phoneNumber.startsWith("0")) {
            throw new IllegalArgumentException("Invalid Phone Number. Phone number must be 11 digits and start with 0");
        }
    }

    public void deposit(String accountNumber, double amount) {
        Account account = findAccountWithAccountNumber(accountNumber);
        account.deposit(amount);
    }

    public void withdraw(String accountNumber, double amount, String userPin) {
        Account account = findAccountWithAccountNumber(accountNumber);
        account.withdraw(amount, userPin);
    }


    public double checkBalance(String accountNumber, String userPin) {
        Account account = findAccountWithAccountNumber(accountNumber);
        return account.checkBalance(userPin);
    }

    public void transfer(String senderAccount, String recieverAccount, double amount, String userPin) {
        withdraw(senderAccount, amount, userPin);
        deposit(recieverAccount, amount);
    }
}
