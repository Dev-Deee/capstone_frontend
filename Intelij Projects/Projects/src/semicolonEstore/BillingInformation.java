package semicolonEstore;

public class BillingInformation extends CreditCardInformation {
    private String phoneNumber;
    private String deliveryAddress;
    private String recieverName;



    public BillingInformation(String cvv, String cardExpiryYearAndMonth, String creditCardNumber, String creditCardType, String cardHolderName, String phoneNumber, String deliveryAddress, String recieverName){}
/*
    public BillingInformation(int phoneNumber, String deliveryAddress, String recieverName){
        this.phoneNumber = phoneNumber;
        this.deliveryAddress = deliveryAddress;
        this.recieverName = recieverName;
    }*/
}
