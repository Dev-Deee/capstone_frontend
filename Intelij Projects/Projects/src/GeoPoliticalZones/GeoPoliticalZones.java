package GeoPoliticalZones;
import java.util.Scanner;
import static java.lang.System.out;

public class GeoPoliticalZones {
    static void main() {
            out.print("Enter state: ");
            String state = new Scanner(System.in).nextLine();

            String geoPoliticalZone = GeoPoliticalZone.getPoliticalZones(state);

            out.println("GeoPoliticalZone: " + geoPoliticalZone);
    }


}

