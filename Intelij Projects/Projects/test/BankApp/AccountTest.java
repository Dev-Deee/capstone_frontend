package BankApp;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;


public class AccountTest {
    Account pensionAccount;

    @BeforeEach
    public void setUp() {
        pensionAccount = new Account("John Doe", "0123", "08141961961", 19, "08141961961" );
    }

    @Test
    public void testThatDeposit5k_Gives5kBalance() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        balance = pensionAccount.checkBalance("0123");
        assertEquals(5_000, balance);
    }

    @Test
    public void testThatDeposit5kTwice_Gives10kBalance() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.deposit(5_000);
        balance = pensionAccount.checkBalance("0123");
        assertEquals(10_000, balance);

    }

    @Test
    public void testThatDepositNegativeAmount_GivesBalance() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.deposit(-5_000);
        balance = pensionAccount.checkBalance("0123");
        assertEquals(5_000, balance);
    }

    @Test
    public void testThatWithdraw2k_Gives3kBalance() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.withdraw(2_000, "0123");
        balance = pensionAccount.checkBalance("0123");
        assertEquals(3_000, balance);
    }

    @Test
    public void testThatWithdraw2k_WithInCorrectPin_throwsException() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.withdraw(2000, "9999"));

    }

    @Test
    public void testThatWithdrawNegative_throwsException() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.withdraw(-2_000, "0123"));
        assertEquals(5_000, pensionAccount.checkBalance("0123"));
    }

    @Test
    public void testThatWithdrawOf_AmountGreaterBalance_throwsException() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.withdraw(7_000, "0123"));
        assertEquals(5_000, pensionAccount.checkBalance("0123"));
    }

    @Test
    public void testThatWithdraw2kTwice_Gives1kBalance() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);

        pensionAccount.deposit(5_000);
        pensionAccount.withdraw(2_000, "0123");
        pensionAccount.withdraw(2_000, "0123");
        balance = pensionAccount.checkBalance("0123");
        assertEquals(1_000, balance);
    }

    @Test
    public void testThatDeposit_Zero_DoesNotChangeBalance() {
        pensionAccount.deposit(5_000);
        pensionAccount.deposit(0);
        assertEquals(5_000, pensionAccount.checkBalance("0123"));
    }

    @Test
    public void testThatWithdraw5k_GivesBalance() {
    int balance = pensionAccount.checkBalance("0123");
    assertEquals(0, balance);

    pensionAccount.deposit(5_000);
    pensionAccount.withdraw(5_000, "0123");
    balance = pensionAccount.checkBalance("0123");
    assertEquals(0, balance);
    }

    @Test
    public void testThatWithdrawAmountGreaterThanBalance_ThrowsException() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);
        pensionAccount.deposit(5_000);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.withdraw(7_000, "0123"));
    }

    @Test
    public void testThatWithdraw_Zero_ThrowsException() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);
        pensionAccount.deposit(5_000);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.withdraw(0, "0123"));
    }

    @Test
    public void testThat_InvalidAge_ThrowsException() {
        int age = pensionAccount.getAge();
        assertEquals(19, age);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.setAge(16));
    }

    @Test
    public void testThatWithdraw_Zero_DoesNotChangeBalance() {
        int balance = pensionAccount.checkBalance("0123");
        assertEquals(0, balance);
        pensionAccount.deposit(5_000);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.withdraw(0, "0123"));
    }

    @Test
    public void testThatAge_is_Valid() {
        int age = pensionAccount.getAge();
        assertEquals(19, age);
        pensionAccount.setAge(23);
        assertEquals(23, pensionAccount.getAge());
    }

    @Test
    public void testThat_NegativeAge_ThrowsException() {
        int age = pensionAccount.getAge();
        assertEquals(19, age);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.setAge(-22));
    }

    @Test
    public void testThat_Age_greaterThan100_ThrowsException() {
        int age = pensionAccount.getAge();
        assertEquals(19, age);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.setAge(101));
    }

    @Test
    public void testThat_ZeroAge_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.setAge(0));
    }

    @Test
    public void test_thatPhoneNumber_IsValid() {
        String phoneNumber = pensionAccount.getPhoneNumber();
        assertEquals("08141961961", phoneNumber);
    }

    @Test
    public void testThatEmptyPhoneNumber_throwsException() {
        String phoneNumber = pensionAccount.getPhoneNumber();
        assertEquals("08141961961", phoneNumber);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.setPhoneNumber(""));
    }

    @Test
    public void testThatPhoneNumberLength_IsValid() {
        String phoneNumber = pensionAccount.getPhoneNumber();
        assertEquals("08141961961", phoneNumber);
        assertThrows(IllegalArgumentException.class, () -> pensionAccount.setPhoneNumber("08141966461961"));

    }

    /*@Test
    public void testThat_AccountNumberIsGenerated_fromPhoneNumber(){
        String accountNumber = pensionAccount.getAccount();
        pensionAccount.setPhoneNumber("08141961961");
        assertEquals("8141961961", accountNumber);

    }*/
}
