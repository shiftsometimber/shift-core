package uk.co.shiftsometimber.mytimber;

/** Exact, stateless navigation allowlist; never accepts a URL supplied by an intent. */
public final class WidgetRoute {
    private WidgetRoute() {}
    public static String destination(String key) {
        if ("today".equals(key)) return NavigationPolicy.START;
        if ("progress".equals(key)) return "https://shiftsometimber.co.uk/member/dashboard#visualise";
        if ("grub".equals(key)) return "https://shiftsometimber.co.uk/member/grub";
        return null;
    }
}
