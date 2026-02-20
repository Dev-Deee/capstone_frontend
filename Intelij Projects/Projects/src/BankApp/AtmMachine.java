package BankApp;

import java.util.Scanner;
    public class AtmMachine {
        private static Bank bank;

        static void main() {
            bank = new Bank("Christian Fake bank");
            displayMainMenu();
        }

        private static void displayMainMenu() {
            String mainMenu = """
                Welcome to Christian Fake Bank!!!
                1-> Create Account
                2-> Deposit
                3 -> Withdraw
                4 -> Transfer
                5 -> Check Balance
                6 - > Exit
                """;
            char response = input(mainMenu).charAt(0);
            switch (response){
                case '1'-> createAccount();
                case '2' -> deposit();
                case '3' -> withdraw();
                case '4'-> transfer();
                case '5' -> checkBalance();
                default -> exit();
            }

        }

        private static void checkBalance() {
            String accountNumber = input("Enter your Account Number: ");
            String pin = input("Enter pin Number: ");
            try{
                double balance = bank.checkBalance(accountNumber, pin);
                print("Balance is: "+ balance);
            }
            catch (Exception e){
                print(e.getMessage());
            }
            finally{
                displayMainMenu();
            }
        }

        private static void transfer() {
            String senderAccount = input("Enter your Account Number: ");
            String receiverAccount = input("Enter her Account Number: ");
            String pin = input("Enter pin Number: ");
            double amount = Double.parseDouble(input("Enter Amount: "));
            try{
                bank.transfer(senderAccount, receiverAccount, amount, pin);
                print("Transfer Successful");
                double balance = bank.checkBalance(senderAccount, pin);
                print("Balance is " + balance);
            }
            catch(Exception ex){
                print(ex.getMessage());
            }
            finally {
                displayMainMenu();
            }
        }

        private static void withdraw() {
            String accountNumber = input("Enter Account Number: ");
            String pin = input("Enter pin Number: ");
            int amount = Integer.parseInt(input("Enter Amount: "));
            try{
                bank.withdraw(accountNumber,amount, pin);
                double balance = bank.checkBalance(accountNumber, pin);
                print("Withdraw successful!!!");
                print("New Balance: " + balance);
            }
            catch (Exception e){
                print(e.getMessage());
            }
            finally {
                displayMainMenu();
            }
        }

        private static void deposit() {
            String accountNumber = input("Enter Account Number: ");
            double amount = Integer.parseInt(input("Enter Amount: "));
            try {
                bank.deposit(accountNumber, amount);
                print("Deposit successful");
            }
            catch (Exception ex){
                print(ex.getMessage());
            }
            finally {
                displayMainMenu();
            }
        }

        private static void createAccount() {

            String name = input("Enter Name: ");
            String phoneNumber = input("Enter Phone Number: ");
            String pin   = input("Enter 4 digit Pin: ");
            int age = Integer.parseInt(input("Enter Age (digit): "));
            try {
                bank.createAccount(name, pin, phoneNumber, age);
                print("Account created successfully");
            }
            catch(Exception ex){
                print(ex.getMessage());
            }
            finally {
                displayMainMenu();
            }
        }

        private static void exit() {
            print("Good bye from the app");
            System.exit(0);
        }

        private static String input(String message) {
            Scanner input = new Scanner(System.in);
            print(message);
            return  input.nextLine();
        }

        private static void print(String mainMenu) {
            System.out.println(mainMenu);
        }

    }
