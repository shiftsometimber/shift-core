import Foundation

enum NavigationDecision: String { case internalPage, externalPage, deny }
enum NavigationPolicy {
    static let productionOrigin = "https://shiftsometimber.co.uk"
    private(set) static var origin = productionOrigin
    private(set) static var start = URL(string: "https://shiftsometimber.co.uk/member/dashboard#today")!
    private(set) static var healthTestingEnabled = false
    // The DEBUG shell supplies this from a build setting; never from page JS.
    @discardableResult static func configureHealthTestOrigin(_ raw:String) -> Bool {
        origin=productionOrigin;start=URL(string:origin+"/member/dashboard#today")!;healthTestingEnabled=false
        guard classify(raw) != .deny,let c=URLComponents(string:raw),c.scheme?.lowercased()=="https",
              let host=c.host?.lowercased(),host.range(of:"^[a-z0-9.-]+$",options:.regularExpression) != nil,host != "shiftsometimber.co.uk",!host.hasSuffix(".shiftsometimber.co.uk"),
              c.query == nil,c.fragment == nil,c.path.isEmpty || c.path == "/" else{return false}
        origin="https://"+host;start=URL(string:origin+"/member/dashboard#today")!;healthTestingEnabled=true;return true
    }
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
        return host.lowercased() == URL(string:origin)?.host?.lowercased() ? .internalPage : .externalPage
    }
}
