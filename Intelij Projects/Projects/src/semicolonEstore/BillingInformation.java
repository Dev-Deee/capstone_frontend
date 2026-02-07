package semicolonEstore;

public class BillingInformation {
    private int phoneNumber;
    private String deliveryAddress;
    private String recieverName;

    public BillingInformation(int phoneNumber, String deliveryAddress, String recieverName){
        this.phoneNumber = phoneNumber;
        this.deliveryAddress = deliveryAddress;
        this.recieverName = recieverName;
    }
}
