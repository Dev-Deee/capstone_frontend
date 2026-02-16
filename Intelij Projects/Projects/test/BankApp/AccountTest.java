package BankApp;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;


public class AccountTest {
    Account pensionAccount;

    @BeforeEach
    public void setUp() {
        pensionAccount = new Account(1234);
    }

    @Test
    public void testThatDeposit5k_Gives5kBalance() {
        int balance = pensionAccount.checkBalance(1234);
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        balance = pensionAccount.checkBalance(1234);
        assertEquals(5_000, balance);
    }

    @Test
    public void testThatDeposit5kTwice_Gives10kBalance() {
        int balance = pensionAccount.checkBalance(1234);
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.deposit(5_000);
        balance = pensionAccount.checkBalance(1234);
        assertEquals(10_000, balance);

    }

    @Test
    public void testThatDepositNegativeAmount_GivesBalance() {
        int balance = pensionAccount.checkBalance(1234);
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.deposit(-5_000);
        balance = pensionAccount.checkBalance(1234);
        assertEquals(5_000, balance);
    }

    @Test
    public void testThatWithdraw2k_Gives3kBalance() {
        int balance = pensionAccount.checkBalance(1234);
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.withdraw(2_000, 1234);
        balance = pensionAccount.checkBalance(1234);
        assertEquals(3_000, balance);
    }

    @Test
    public void testThatWithdrawNegative_GivesBalance() {
        int balance = pensionAccount.checkBalance(1234);
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.withdraw(-2_000, 1234);
        balance = pensionAccount.checkBalance(1234);
        assertEquals(5_000, balance);
    }

    @Test
    public void testThatWithdrawAmountGreater5k_Gives5kBalance() {
        int balance = pensionAccount.checkBalance(1234);
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.withdraw(7_000, 1234);
        balance = pensionAccount.checkBalance(1234);
        assertEquals(5_000, balance);
    }

    @Test
    public void testThatwithdraw2kTwice_Gives1kBalance() {
        int balance = pensionAccount.checkBalance(1234);
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.withdraw(2_000, 1234);
        pensionAccount.withdraw(2_000, 1234);
        balance = pensionAccount.checkBalance(1234);
        assertEquals(1_000, balance);
    }

    @Test
    public void testThatwithdraw5k_GivesBalance() {
    int balance = pensionAccount.checkBalance(1234);
    assertEquals(0, balance);

    pensionAccount.deposit(5_000);
    pensionAccount.withdraw(5_000, 1234);
    balance = pensionAccount.checkBalance(1234);
    assertEquals(0, balance);
    }


/*    @Test
    public void testThatwithdrawNegativeAmount_GivesBalance() {

    }*/

}
