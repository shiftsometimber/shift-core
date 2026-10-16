import Foundation

// Only navigation. No member data, health reads, writes or authentication tokens.
enum WidgetRoute {
    static func destination(_ raw: String) -> URL? {
        switch raw {
        case "mytimber://open/today": return NavigationPolicy.start
        case "mytimber://open/progress": return URL(string: "https://shiftsometimber.co.uk/member/dashboard#visualise")
        case "mytimber://open/grub": return URL(string: "https://shiftsometimber.co.uk/member/grub")
        default: return nil
        }
    }
}
