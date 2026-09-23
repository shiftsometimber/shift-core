package uk.co.shiftsometimber.mytimber;
import java.net.URI;
import java.util.Locale;

/** One owned HTTPS origin; no privileged bridge on any origin. */
public final class NavigationPolicy {
    public enum Decision { INTERNAL, EXTERNAL, DENY }
    public static final String START = "https://shiftsometimber.co.uk/member/dashboard#today";
    private NavigationPolicy() {}
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
            return u.getHost().equalsIgnoreCase("shiftsometimber.co.uk") ? Decision.INTERNAL : Decision.EXTERNAL;
        } catch (Exception ignored) { return Decision.DENY; }
    }
}
