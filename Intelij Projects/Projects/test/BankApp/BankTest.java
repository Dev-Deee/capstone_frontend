package BankApp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class BankTest {
        Bank bank;
    @BeforeEach
    public void setup() {
        bank = new Bank("Bank of Nigeria");
    }

    @Test
    public void testThatBank_canCreateAccount() {
        bank.createAccount("Oladayo Ajomole", "0123", "08130556161", 20);
        assertEquals(1, bank.getNumberOfAccounts());
    }

    @Test
    public void testThat_BankCannotCreateAccount_WithInvalidPhoneNumber_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> bank.createAccount("Oladayo Ajomole", "0123", "081305", 20));
        assertThrows(IllegalArgumentException.class, () -> bank.createAccount("Oladayo Ajomole", "0123", "08130A56161", 20));
        assertThrows(IllegalArgumentException.class, () -> bank.createAccount("Oladayo Ajomole", "0123", "18130556161", 20));
    }

    @Test
    public void testThat_BankCannotCreateAccount_WithDuplicateAccountNumber() {
        bank.createAccount("Oladayo Ajomole", "0123", "08130556161", 20);
        assertThrows(IllegalArgumentException.class, () -> bank.createAccount("Another One", "1234", "08130556161", 22));
    }

    @Test
    public void testThat_BankCanFindAccount_WithAccountNumber() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        Account found = bank.findAccountWithAccountNumber("8141961961");
        assertEquals("8141961961", found.getAccount());
    }

    @Test
    public void testThat_FindAccount_WithInvalidAccountNumber_ThrowsException() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        assertThrows(IllegalArgumentException.class, () -> bank.findAccountWithAccountNumber("0000000000"));
    }

    @Test
    public void testThat_FindAccountWithAccountNumber_InEmptyBank_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> bank.findAccountWithAccountNumber("8141961961"));
    }

    @Test
    public void testThat_BankCanDeposit_IntoAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 5000);
        assertEquals(5000, bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCanDeposit_TwiceIntoAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        assertEquals(10000, bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCanDeposit_MultipleTimesIntoAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", 5000);
        assertEquals(40000, bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCannotDeposit_NegativeAmountIntoAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 5000);
        bank.deposit("8141961961", -5000);
        assertEquals(5000, bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCanWithdraw_FromAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 5000);
        bank.withdraw("8141961961", 3000, "0123");
        assertEquals(2000,bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCannotWithdraw_WithWrongPin_FromAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 5000);
        assertThrows(IllegalArgumentException.class, () -> bank.withdraw("8141961961", 3000, "4123"));
        assertEquals(5000,bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCannotWithdraw_NegativeAmount_FromAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 5000);
        assertThrows(IllegalArgumentException.class, () -> bank.withdraw("8141961961", -3000, "0123"));
        assertEquals(5000,bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCannotWithdraw_Twice_FromAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 10000);
        bank.withdraw("8141961961", 3000, "0123");
        bank.withdraw("8141961961", 3000, "0123");
        assertEquals(4000,bank.findAccountWithAccountNumber("8141961961").getBalance(), 0.0);
    }

    @Test
    public void testThat_BankCanCheckBalance_FromAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 10000);
        assertEquals(10000, bank.checkBalance("8141961961", "0123"));
    }

    @Test
    public void testThat_BankCannotCheckBalance_WithWrongPin_FromAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 10000);
        assertThrows(IllegalArgumentException.class, () -> bank.checkBalance("8141961961", "4123"));
    }

    @Test
    public void testThat_BankCanTransfer_FromAccountCreated() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 10000);
        assertEquals(10000, bank.checkBalance("8141961961", "0123"));
        bank.createAccount("Hojay Barbs", "1234", "08130556161", 20);
        bank.transfer("8141961961", "8130556161", 6000,"0123");
        assertEquals(4000, bank.checkBalance("8141961961", "0123"));
        assertEquals(6000, bank.checkBalance("8130556161", "1234"));
    }

    @Test
    public void testThat_BankCannootTransfer_ToAccountThat_doesNotExist() {
        bank.createAccount("Oladayo Ajomole", "0123", "08141961961", 19);
        bank.deposit("8141961961", 10000);
        assertEquals(10000, bank.checkBalance("8141961961", "0123"));
        assertThrows(IllegalArgumentException.class, () -> bank.transfer("8141961961", "8130556161", 6000,"0123"));

    }

}
