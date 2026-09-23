import Foundation

enum NavigationDecision: String { case internalPage, externalPage, deny }
enum NavigationPolicy {
    static let start = URL(string: "https://shiftsometimber.co.uk/member/dashboard#today")!
    static func classify(_ raw: String) -> NavigationDecision {
        let lower = raw.lowercased()
        guard raw.count <= 8192, !raw.contains("\\"), !lower.contains("%0a"), !lower.contains("%0d"),
              !raw.unicodeScalars.contains(where: {$0.value <= 32 || $0.value == 127}),
              let c = URLComponents(string:raw), let scheme=c.scheme?.lowercased() else { return .deny }
        if scheme == "mailto" || scheme == "tel" { return c.path.isEmpty ? .deny : .externalPage }
        guard scheme == "https", let host=c.host, !host.isEmpty, c.user == nil, c.password == nil,
              c.port == nil || c.port == 443 else { return .deny }
        let authority = raw.components(separatedBy:"//").dropFirst().joined(separator:"//").components(separatedBy:"/").first ?? ""
        guard !authority.components(separatedBy:"?")[0].components(separatedBy:"#")[0].contains("%") else { return .deny }
        return host.lowercased() == "shiftsometimber.co.uk" ? .internalPage : .externalPage
    }
}
