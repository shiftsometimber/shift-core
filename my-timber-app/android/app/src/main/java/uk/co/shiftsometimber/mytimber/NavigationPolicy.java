package uk.co.shiftsometimber.mytimber;
import java.net.URI;
import java.util.Locale;

/** One owned HTTPS origin; no privileged bridge on any origin. */
public final class NavigationPolicy {
    public enum Decision { INTERNAL, EXTERNAL, DENY }
    public static final String PRODUCTION_ORIGIN = "https://shiftsometimber.co.uk";
    public static String ORIGIN = PRODUCTION_ORIGIN;
    public static String START = "https://shiftsometimber.co.uk/member/dashboard#today";
    public static boolean healthTestingEnabled = false;
    private NavigationPolicy() {}
    // Called only by the DEBUG shell, using a build-time setting. No JS bridge.
    public static boolean configureHealthTestOrigin(String raw) {
        ORIGIN=PRODUCTION_ORIGIN;START=PRODUCTION_ORIGIN+"/member/dashboard#today";healthTestingEnabled=false;
        if(raw==null||raw.isEmpty()||classify(raw)==Decision.DENY)return false;
        try {
            URI u=new URI(raw);String host=u.getHost().toLowerCase(Locale.ROOT);
            if(!"https".equalsIgnoreCase(u.getScheme())||!host.matches("[a-z0-9.-]+")||host.equals("shiftsometimber.co.uk")||host.endsWith(".shiftsometimber.co.uk")
                ||u.getRawQuery()!=null||u.getRawFragment()!=null||!(u.getRawPath().isEmpty()||u.getRawPath().equals("/")))return false;
            ORIGIN="https://"+host;START=ORIGIN+"/member/dashboard#today";healthTestingEnabled=true;return true;
        }catch(Exception ignored){return false;}
    }
    public static Decision classify(String raw) {
        if (raw == null || raw.length() > 8192 || raw.indexOf('\\') >= 0) return Decision.DENY;
        String lower = raw.toLowerCase(Locale.ROOT);
        if (raw.chars().anyMatch(c -> c <= 32 || c == 127) || lower.contains("%0a") || lower.contains("%0d")) return Decision.DENY;
        try {
            URI u = new URI(raw);
            String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase(Locale.ROOT);
            if (scheme.equals("mailto") || scheme.equals("tel"))
                return u.getSchemeSpecificPart().isEmpty() ? Decision.DENY : Decision.EXTERNAL;
            if (!scheme.equals("https") || u.getHost() == null || u.getUserInfo() != null) return Decision.DENY;
            if (u.getRawAuthority().contains("%") || (u.getPort() != -1 && u.getPort() != 443)) return Decision.DENY;
            return u.getHost().equalsIgnoreCase(new URI(ORIGIN).getHost()) ? Decision.INTERNAL : Decision.EXTERNAL;
        } catch (Exception ignored) { return Decision.DENY; }
    }
}
