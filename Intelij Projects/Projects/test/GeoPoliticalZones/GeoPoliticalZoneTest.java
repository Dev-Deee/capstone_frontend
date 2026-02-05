package GeoPoliticalZones;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class GeoPoliticalZoneTest {
    @Test
    public void testThatNorthCentralStates_ReturnsGeoPoliticalZone() {
        assertEquals("NORTH_CENTRAL", GeoPoliticalZone.getPoliticalZones("BENUE"));
        assertEquals("NORTH_CENTRAL", GeoPoliticalZone.getPoliticalZones("FCT"));
        assertEquals("NORTH_CENTRAL", GeoPoliticalZone.getPoliticalZones("KWARA"));
        assertEquals("NORTH_CENTRAL", GeoPoliticalZone.getPoliticalZones("NASARAWA"));
        assertEquals("NORTH_CENTRAL", GeoPoliticalZone.getPoliticalZones("NIGER"));
        assertEquals("NORTH_CENTRAL", GeoPoliticalZone.getPoliticalZones("PLATEAU"));
    }

    @Test
    public void testThatNorthEastStates_ReturnsGeoPoliticalZone() {
        assertEquals("NORTH_EAST", GeoPoliticalZone.getPoliticalZones("ADAMAWA"));
        assertEquals("NORTH_EAST", GeoPoliticalZone.getPoliticalZones("BAUCHI"));
        assertEquals("NORTH_EAST", GeoPoliticalZone.getPoliticalZones("BORNO"));
        assertEquals("NORTH_EAST", GeoPoliticalZone.getPoliticalZones("GOMBE"));
        assertEquals("NORTH_EAST", GeoPoliticalZone.getPoliticalZones("TARABA"));
        assertEquals("NORTH_EAST", GeoPoliticalZone.getPoliticalZones("YOBE"));
    }

    @Test
    public void testThatNorthWestStates_ReturnsGeoPoliticalZone() {
        assertEquals("NORTH_WEST", GeoPoliticalZone.getPoliticalZones("KADUNA"));
        assertEquals("NORTH_WEST", GeoPoliticalZone.getPoliticalZones("KATSINA"));
        assertEquals("NORTH_WEST", GeoPoliticalZone.getPoliticalZones("KANO"));
        assertEquals("NORTH_WEST", GeoPoliticalZone.getPoliticalZones("KEBBI"));
        assertEquals("NORTH_WEST", GeoPoliticalZone.getPoliticalZones("SOKOTO"));
        assertEquals("NORTH_WEST", GeoPoliticalZone.getPoliticalZones("JIGAWA"));
        assertEquals("NORTH_WEST", GeoPoliticalZone.getPoliticalZones("ZAMFARA"));
    }

    @Test
    public void testThatSouthEastStates_ReturnsGeoPoliticalZone() {
        assertEquals("SOUTH_EAST", GeoPoliticalZone.getPoliticalZones("ABIA"));
        assertEquals("SOUTH_EAST", GeoPoliticalZone.getPoliticalZones("ANAMBRA"));
        assertEquals("SOUTH_EAST", GeoPoliticalZone.getPoliticalZones("EBONYI"));
        assertEquals("SOUTH_EAST", GeoPoliticalZone.getPoliticalZones("ENUGU"));
        assertEquals("SOUTH_EAST", GeoPoliticalZone.getPoliticalZones("IMO"));
    }

    @Test
    public void testThatSouthSouthStates_ReturnsGeoPoliticalZone() {
        assertEquals("SOUTH_SOUTH", GeoPoliticalZone.getPoliticalZones("AKWA-IBOM"));
        assertEquals("SOUTH_SOUTH", GeoPoliticalZone.getPoliticalZones("BAYELSA"));
        assertEquals("SOUTH_SOUTH", GeoPoliticalZone.getPoliticalZones("CROSS-RIVER"));
        assertEquals("SOUTH_SOUTH", GeoPoliticalZone.getPoliticalZones("DELTA"));
        assertEquals("SOUTH_SOUTH", GeoPoliticalZone.getPoliticalZones("EDO"));
        assertEquals("SOUTH_SOUTH", GeoPoliticalZone.getPoliticalZones("RIVERS"));
    }

    @Test
    public void testThatSouthWestStates_ReturnsGeoPoliticalZone() {
        assertEquals("SOUTH_WEST", GeoPoliticalZone.getPoliticalZones("EKITI"));
        assertEquals("SOUTH_WEST", GeoPoliticalZone.getPoliticalZones("LAGOS"));
        assertEquals("SOUTH_WEST", GeoPoliticalZone.getPoliticalZones("OSUN"));
        assertEquals("SOUTH_WEST", GeoPoliticalZone.getPoliticalZones("ONDO"));
        assertEquals("SOUTH_WEST", GeoPoliticalZone.getPoliticalZones("OGUN"));
        assertEquals("SOUTH_WEST", GeoPoliticalZone.getPoliticalZones("OYO"));
    }

    @Test
    public void testThatMethodChecksForWhiteSpaces() {
        assertNull(GeoPoliticalZone.getPoliticalZones("   "));
        assertNull(GeoPoliticalZone.getPoliticalZones("\t"));
        assertNull(GeoPoliticalZone.getPoliticalZones("\n"));
        assertNull(GeoPoliticalZone.getPoliticalZones(""));
    }

    @Test
    public void testThatMethodPerformsCaseInsensitiveComparison() {
        assertEquals("SOUTH_WEST", GeoPoliticalZone.getPoliticalZones("LaGoS"));
        assertEquals("NORTH_CENTRAL", GeoPoliticalZone.getPoliticalZones("bEnUe"));
        assertEquals("NORTH_EAST", GeoPoliticalZone.getPoliticalZones("BaUcHi"));
    }

    @Test
    public void testThatMethodReturnsNullForInvalidState() {
        assertNull(GeoPoliticalZone.getPoliticalZones("InvalidState"));
    }

}
