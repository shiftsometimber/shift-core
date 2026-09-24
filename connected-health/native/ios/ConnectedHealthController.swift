import UIKit
import WebKit
import HealthKit

// A native, user-activated sheet. No JavaScript-to-health data bridge.
@available(iOS 16.0, *)
@MainActor final class ConnectedHealthController: UIViewController {
    static let origin = "https://shiftsometimber.co.uk"
    private let web: WKWebView
    private var task: Task<Void,Never>?
    private var account = 0
    private var cookie = ""
    private var connection: [String:Any]?
    private var choices: [String:UISwitch] = [:]
    private let agreement = UISwitch()
    private let status = UILabel()
    private let action = UIButton(type:.system)
    private let stack = UIStackView()
    private let cream = UIColor(red:231/255,green:227/255,blue:218/255,alpha:1)
    private var backgroundObserver: NSObjectProtocol?
    init(web:WKWebView){self.web=web;super.init(nibName:nil,bundle:nil)}
    required init?(coder:NSCoder){fatalError("Use init(web:)")}
    private func label(_ text:String)->UILabel {
        let label=UILabel();label.text=text;label.numberOfLines=0;label.textColor=cream
        label.font = .preferredFont(forTextStyle:.body);label.adjustsFontForContentSizeCategory=true;return label
    }
    override func viewDidLoad(){
        super.viewDidLoad();view.backgroundColor=UIColor(red:5/255,green:5/255,blue:5/255,alpha:1)
        isModalInPresentation=true
        let scroll=UIScrollView();scroll.translatesAutoresizingMaskIntoConstraints=false;view.addSubview(scroll)
        stack.axis = .vertical;stack.spacing=16;stack.translatesAutoresizingMaskIntoConstraints=false;scroll.addSubview(stack)
        NSLayoutConstraint.activate([scroll.topAnchor.constraint(equalTo:view.safeAreaLayoutGuide.topAnchor),scroll.bottomAnchor.constraint(equalTo:view.safeAreaLayoutGuide.bottomAnchor),scroll.leadingAnchor.constraint(equalTo:view.leadingAnchor),scroll.trailingAnchor.constraint(equalTo:view.trailingAnchor),stack.topAnchor.constraint(equalTo:scroll.contentLayoutGuide.topAnchor,constant:24),stack.bottomAnchor.constraint(equalTo:scroll.contentLayoutGuide.bottomAnchor,constant:-24),stack.leadingAnchor.constraint(equalTo:scroll.contentLayoutGuide.leadingAnchor,constant:24),stack.trailingAnchor.constraint(equalTo:scroll.contentLayoutGuide.trailingAnchor,constant:-24),stack.widthAnchor.constraint(equalTo:scroll.frameLayoutGuide.widthAnchor,constant:-48)])
        stack.addArrangedSubview(label("Connect Apple Health"))
        stack.addArrangedSubview(label("Optional. Choose the readings My Timber may copy into your account for progress and personal summaries across the app and website. Read-only; no clinical verification, treatment changes, advertising or external AI sharing. The first import covers up to 30 days."))
        for metric in ["weight","height","steps","sleep"] {
            let toggle=UISwitch();toggle.accessibilityLabel=metric.capitalized;toggle.addTarget(self,action:#selector(changed),for:.valueChanged);choices[metric]=toggle
            let row=UIStackView(arrangedSubviews:[label(metric.capitalized),toggle]);row.spacing=12;stack.addArrangedSubview(row)
        }
        let agreementRow=UIStackView(arrangedSubviews:[label("I agree to SHIFT storing and using these selected health readings in My Timber."),agreement]);agreementRow.spacing=12;stack.addArrangedSubview(agreementRow)
        stack.addArrangedSubview(label("Stop syncing, stop using readings, or delete imported copies in My Timber Settings. Phone permission controls access; removing it does not delete copies already imported. Manual entries stay unchanged. Height remains a suggestion to confirm."))
        status.numberOfLines=0;status.textColor=cream;status.accessibilityTraits.insert(.updatesFrequently);stack.addArrangedSubview(status)
        action.setTitle("Agree and connect",for:.normal);action.tintColor=cream;action.heightAnchor.constraint(greaterThanOrEqualToConstant:44).isActive=true;action.addTarget(self,action:#selector(connect),for:.touchUpInside);action.isEnabled=false;stack.addArrangedSubview(action)
        let close=UIButton(type:.system);close.setTitle("Return to My Timber",for:.normal);close.tintColor=cream;close.heightAnchor.constraint(greaterThanOrEqualToConstant:44).isActive=true;close.addTarget(self,action:#selector(finish),for:.touchUpInside);stack.addArrangedSubview(close)
        backgroundObserver=NotificationCenter.default.addObserver(forName:UIApplication.didEnterBackgroundNotification,object:nil,queue:.main){[weak self] _ in Task { @MainActor in self?.cancelForBackground() }}
        task=Task { await loadAccount() }
    }
    @objc private func changed(){agreement.isOn=false;action.setTitle("Agree and connect",for:.normal)}
    private func sessionCookie() async throws -> String {
        let cookies=await web.configuration.websiteDataStore.httpCookieStore.allCookies()
        let values=cookies.filter { $0.name=="sst_session" && $0.isSecure && ["shiftsometimber.co.uk",".shiftsometimber.co.uk"].contains($0.domain) && $0.path=="/" && ($0.expiresDate == nil || $0.expiresDate!>Date()) }.map { "sst_session="+$0.value }
        guard Set(values).count==1,let value=values.first else {throw SyncError.accountChanged};return value
    }
    private func request(_ suffix:String="",body:[String:Any]?=nil) async throws -> [String:Any] {
        try Task.checkCancellation();guard !cookie.isEmpty,try await sessionCookie()==cookie else {throw SyncError.accountChanged}
        var request=URLRequest(url:URL(string:Self.origin+"/v1/connected-health"+suffix)!,cachePolicy:.reloadIgnoringLocalCacheData,timeoutInterval:20)
        request.httpMethod=body==nil ? "GET":"POST";request.setValue(cookie,forHTTPHeaderField:"Cookie");request.setValue(Self.origin,forHTTPHeaderField:"Origin");request.setValue("application/json",forHTTPHeaderField:"Accept")
        if let body=body {request.setValue("application/json",forHTTPHeaderField:"Content-Type");request.httpBody=try JSONSerialization.data(withJSONObject:body)}
        let config=URLSessionConfiguration.ephemeral;config.httpCookieStorage=nil;config.httpShouldSetCookies=false;config.urlCache=nil;config.requestCachePolicy = .reloadIgnoringLocalCacheData
        let session=URLSession(configuration:config,delegate:NoHealthRedirects(),delegateQueue:nil);defer{session.invalidateAndCancel()}
        let (data,response)=try await session.data(for:request)
        try Task.checkCancellation();guard try await sessionCookie()==cookie else {throw SyncError.accountChanged}
        guard data.count<=2_000_000,let response=response as? HTTPURLResponse,response.statusCode==200,let result=try JSONSerialization.jsonObject(with:data) as? [String:Any],result["ok"] as? Bool==true else {throw SyncError.unavailable}
        if let id=result["accountId"] as? Int,account != 0,id != account {throw SyncError.accountChanged};return result
    }
    private func loadAccount() async {
        do {
            cookie=try await sessionCookie();let result=try await request();guard let id=result["accountId"] as? Int,id>0 else {throw SyncError.accountChanged};account=id
            connection=(result["connections"] as? [[String:Any]])?.first{$0["provider"] as? String=="apple_health"}
            let active=connection?["syncEnabled"] as? Bool==true && connection?["requiresReconnect"] as? Bool==false && connection?["consentVersion"] as? String=="connected-health/2026-09-24-v1"
            if active {for metric in connection?["scopes"] as? [String] ?? [] {choices[metric]?.isOn=true};agreement.isOn=true;action.setTitle("Sync selected readings",for:.normal)}
            let target=result["accountLabel"] as? String ?? "your signed-in account"
            status.text="Import destination: \(target). Nothing has been read from Apple Health yet."
            action.isEnabled=HKHealthStore.isHealthDataAvailable()
            if !action.isEnabled {status.text="Apple Health is unavailable on this device. Your manual My Timber entries still work."}
        }catch{status.text="Connection is not available for this signed-in session. Return to My Timber and check your sign-in. Nothing has been imported."}
    }
    @objc private func connect(){
        let selected=Set(choices.filter{$0.value.isOn}.map{$0.key})
        guard agreement.isOn,!selected.isEmpty,account>0 else {status.text="Choose at least one reading and agree before connecting.";return}
        action.isEnabled=false;choices.values.forEach{$0.isEnabled=false};agreement.isEnabled=false
        task=Task {
            var imported=0
            do {
                let latest=try await request();let current=(latest["connections"] as? [[String:Any]])?.first{$0["provider"] as? String=="apple_health"}
                // A delayed screen cannot overwrite another device's changed consent.
                guard (current?["revision"] as? Int ?? 0)==(connection?["revision"] as? Int ?? 0) else {throw SyncError.accountChanged}
                let reuse=current?["syncEnabled"] as? Bool==true && current?["requiresReconnect"] as? Bool==false && Set(current?["scopes"] as? [String] ?? [])==selected && current?["consentVersion"] as? String=="connected-health/2026-09-24-v1"
                var c:[String:Any]
                if reuse {c=current!} else {
                    let grant=try await request("/consent",body:["expectedAccountId":account,"provider":"apple_health","expectedRevision":current?["revision"] as? Int ?? 0,"consentVersion":"connected-health/2026-09-24-v1","consent":true,"scopes":selected.sorted()]);guard let saved=grant["connection"] as? [String:Any] else{throw SyncError.unavailable};c=saved;connection=saved
                }
                guard let connectionID=c["connectionId"] as? String,let revision=c["revision"] as? Int else{throw SyncError.unavailable}
                let permit=try TimberHealthPermit(memberID:account,connectionID:connectionID,revision:revision,scopes:selected,consentVersion:"connected-health/2026-09-24-v1",explicitlyConsented:true)
                let reader=TimberHealthReader();if !reuse {try await reader.requestReadAccess(permit)}
                status.text="Reading the categories you chose. Apple controls which readings are available."
                let read=try await reader.read(permit);try Task.checkCancellation()
                var syncRevision=c["syncRevision"] as? Int ?? 0
                for start in stride(from:0,to:read.observations.count,by:32) {
                    let check=try await request();let live=(check["connections"] as? [[String:Any]])?.first{$0["provider"] as? String=="apple_health"}
                    guard live?["connectionId"] as? String==connectionID,live?["revision"] as? Int==revision,live?["syncEnabled"] as? Bool==true,live?["requiresReconnect"] as? Bool==false else {throw SyncError.accountChanged}
                    let chunk=Array(read.observations[start..<min(start+32,read.observations.count)])
                    let records=try JSONSerialization.jsonObject(with:JSONEncoder().encode(chunk))
                    let receipt=try await request("/import",body:["expectedAccountId":account,"provider":"apple_health","connectionId":connectionID,"revision":revision,"syncRevision":syncRevision,"batchId":UUID().uuidString,"records":records,"deleted":[]])
                    guard let next=receipt["syncRevision"] as? Int else {throw SyncError.unavailable};syncRevision=next;imported+=chunk.count
                }
                let partial=read.outcomes.values.contains("read_failed")
                status.text=imported==0 ? "No shared readings were imported. This does not tell us whether Apple Health has no data or access was not shared. Existing history is unchanged." : "\(imported) readings saved to My Timber.\(partial ? " Some categories could not be read; existing history is unchanged." : "") Return to Settings to see their sources and dates."
                c["syncRevision"]=syncRevision;connection=c
            }catch{status.text="Sync stopped. \(imported) readings were confirmed before stopping. Check My Timber before retrying; a failed reply does not prove the last request was unsaved."}
            choices.values.forEach{$0.isEnabled=true};agreement.isEnabled=true;action.isEnabled=false
        }
    }
    private func cancelForBackground(){task?.cancel();cookie="";account=0;action.isEnabled=false;status.text="Sync stopped when the app left the foreground. Return to My Timber before reconnecting."}
    @objc private func finish(){task?.cancel();cookie="";dismiss(animated:true){[weak web] in web?.load(URLRequest(url:URL(string:Self.origin+"/member/settings")!,cachePolicy:.reloadIgnoringLocalCacheData))}}
    deinit{task?.cancel();if let observer=backgroundObserver{NotificationCenter.default.removeObserver(observer)}}
    private enum SyncError:Error{case accountChanged,unavailable}
}
final class NoHealthRedirects:NSObject,URLSessionTaskDelegate {
    func urlSession(_ session:URLSession,task:URLSessionTask,willPerformHTTPRedirection response:HTTPURLResponse,newRequest request:URLRequest,completionHandler:@escaping(URLRequest?)->Void){completionHandler(nil)}
}
@MainActor enum TimberHealthEntry {
    static func handle(_ action:WKNavigationAction,web:WKWebView,presenter:UIViewController)->Bool {
        guard action.request.url?.path=="/member/connected-health" else{return false}
        // Swallow this path even when an untrusted frame tries to invoke it.
        guard action.navigationType == .linkActivated,action.sourceFrame.isMainFrame,action.targetFrame?.isMainFrame==true,action.request.httpMethod=="GET",action.request.url?.absoluteString=="https://shiftsometimber.co.uk/member/connected-health",web.url?.scheme=="https",web.url?.host=="shiftsometimber.co.uk",web.url?.port==nil,presenter.presentedViewController==nil else{return true}
        if #available(iOS 16.0, *) {presenter.present(ConnectedHealthController(web:web),animated:true)}
        return true
    }
}
