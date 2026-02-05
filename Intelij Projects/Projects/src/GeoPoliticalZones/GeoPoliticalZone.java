package GeoPoliticalZones;

public enum GeoPoliticalZone {

    NORTH_CENTRAL("Benue","FCT", "Kogi","Kwara","Nasarawa", "Niger", "Plateau" ),
    NORTH_EAST("Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"),
    NORTH_WEST("Kaduna", "Katsina", "Kano", "Kebbi", "Sokoto", "Jigawa", "Zamfara"),
    SOUTH_EAST("Abia", "Anambra", "Ebonyi", "Enugu", "Imo"),
    SOUTH_SOUTH("Akwa-Ibom", "Bayelsa", "Cross-River", "Delta", "Edo", "Rivers"),
    SOUTH_WEST("Ekiti", "Lagos", "Osun", "Ondo", "Ogun", "Oyo");

    final String[] state;
    GeoPoliticalZone(String... state) {
        this.state = state;
    }

    public  static String getPoliticalZones(String states) {
        if (states == null || states.trim().isEmpty()) {
            return null;
        }

        states = states.trim();

        for(GeoPoliticalZone zone: GeoPoliticalZone.values()) {
           for(String state: zone.state) {
               if(state.equalsIgnoreCase(states)){
                   return zone.toString();
               }
           }
       }
       //return "The state is invalid. Provide a valid state name.";
        return null;
    }


}
