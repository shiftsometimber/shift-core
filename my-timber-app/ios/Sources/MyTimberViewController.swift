import UIKit
import WebKit

final class MyTimberViewController:UIViewController,WKNavigationDelegate,WKUIDelegate {
    private var web:WKWebView!
    private let errorBox=UIStackView()
    private var timer:Timer?
    private var failed=false
    private let cream=UIColor(red:231/255,green:227/255,blue:218/255,alpha:1)
    override var preferredStatusBarStyle:UIStatusBarStyle{.lightContent}
    override func viewDidLoad(){
        super.viewDidLoad()
        view.backgroundColor=UIColor(red:5/255,green:5/255,blue:5/255,alpha:1)
        let config=WKWebViewConfiguration()
        config.websiteDataStore = .default() // Existing credentials, separate app session.
        config.preferences.javaScriptCanOpenWindowsAutomatically=false
        config.applicationNameForUserAgent="MyTimberNativePreview/0.1"
        if let url=Bundle.main.url(forResource:"native-presentation",withExtension:"js"),
           let source=try? String(contentsOf:url,encoding:.utf8){
            config.userContentController.addUserScript(WKUserScript(source:source,injectionTime:.atDocumentEnd,forMainFrameOnly:true))
        }
        // Deliberately no WKScriptMessageHandler, filesystem bridge or certificate bypass.
        web=WKWebView(frame:.zero,configuration:config)
        web.isOpaque=false;web.backgroundColor=view.backgroundColor
        web.navigationDelegate=self;web.uiDelegate=self;web.allowsBackForwardNavigationGestures=true
        web.translatesAutoresizingMaskIntoConstraints=false
        errorBox.axis = .vertical;errorBox.spacing=12;errorBox.isHidden=true
        errorBox.translatesAutoresizingMaskIntoConstraints=false
        let stack=UIStackView(arrangedSubviews:[errorBox,web]);stack.axis = .vertical
        stack.translatesAutoresizingMaskIntoConstraints=false;view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo:view.safeAreaLayoutGuide.topAnchor),
            stack.leadingAnchor.constraint(equalTo:view.safeAreaLayoutGuide.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo:view.safeAreaLayoutGuide.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo:view.keyboardLayoutGuide.topAnchor)
        ])
        let startup=StartupOverlay(frame:.zero)
        startup.translatesAutoresizingMaskIntoConstraints=false
        view.addSubview(startup)
        NSLayoutConstraint.activate([
            startup.leadingAnchor.constraint(equalTo:view.leadingAnchor),
            startup.trailingAnchor.constraint(equalTo:view.trailingAnchor),
            startup.topAnchor.constraint(equalTo:view.topAnchor),
            startup.bottomAnchor.constraint(equalTo:view.bottomAnchor)
        ])
        loadToday()
        startup.playAndRemove()
    }
    private func loadToday(){
        web.load(URLRequest(url:NavigationPolicy.start,cachePolicy:.reloadIgnoringLocalCacheData,timeoutInterval:30))
    }
    private func showFailure(_ text:String){
        failed=true;timer?.invalidate()
        errorBox.arrangedSubviews.forEach{errorBox.removeArrangedSubview($0);$0.removeFromSuperview()}
        let label=UILabel();label.numberOfLines=0;label.text=text;label.textColor=cream
        label.font = .preferredFont(forTextStyle:.body);label.adjustsFontForContentSizeCategory=true
        let button=UIButton(type:.system);button.setTitle("Return to Today",for:.normal);button.tintColor=cream
        button.heightAnchor.constraint(greaterThanOrEqualToConstant:44).isActive=true
        button.addTarget(self,action:#selector(confirmReturn),for:.touchUpInside)
        errorBox.addArrangedSubview(label);errorBox.addArrangedSubview(button);errorBox.isHidden=false
    }
    @objc private func confirmReturn(){
        let alert=UIAlertController(title:"Return to Today?",message:"Unsaved entries on this page may be lost. No form or payment will be resent automatically.",preferredStyle:.alert)
        alert.addAction(UIAlertAction(title:"Stay here",style:.cancel))
        alert.addAction(UIAlertAction(title:"Return",style:.default){[weak self] _ in self?.loadToday()})
        present(alert,animated:true)
    }
    private func openOutside(_ url:URL){
        guard NavigationPolicy.classify(url.absoluteString) == .externalPage else{return}
        let alert=UIAlertController(title:"Open outside My Timber?",message:"Your browser, phone or email app will handle this link.",preferredStyle:.alert)
        alert.addAction(UIAlertAction(title:"Cancel",style:.cancel))
        alert.addAction(UIAlertAction(title:"Open",style:.default){_ in UIApplication.shared.open(url,options:[:])})
        if presentedViewController == nil {present(alert,animated:true)}
    }
    func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){
        guard let url=action.request.url else{decisionHandler(.cancel);return}
        let decision=NavigationPolicy.classify(url.absoluteString)
        // Embedded HTTPS resources/challenges get the browser's normal isolation.
        if action.targetFrame?.isMainFrame == false {
            decisionHandler(url.scheme?.lowercased() == "https" ? .allow : .cancel);return
        }
        if decision == .internalPage {
            if action.targetFrame == nil {webView.load(action.request);decisionHandler(.cancel)} else {decisionHandler(.allow)}
        } else {decisionHandler(.cancel);if decision == .externalPage{openOutside(url)}}
    }
    func webView(_ webView:WKWebView,createWebViewWith configuration:WKWebViewConfiguration,for action:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView?{nil}
    func webView(_ webView:WKWebView,didStartProvisionalNavigation navigation:WKNavigation!){
        failed=false;errorBox.isHidden=true;timer?.invalidate()
        timer=Timer.scheduledTimer(withTimeInterval:30,repeats:false){[weak self] _ in
            self?.showFailure("A connection is needed. Nothing has been confirmed as saved by this app. Check your account before repeating any save or payment.")
        }
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){timer?.invalidate();if !failed{errorBox.isHidden=true}}
    func webView(_ webView:WKWebView,didFail navigation:WKNavigation!,withError error:Error){handle(error)}
    func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error){handle(error)}
    private func handle(_ error:Error){
        if (error as NSError).code == NSURLErrorCancelled{return}
        showFailure("My Timber could not load securely. Check your connection. Check your account before repeating any save or payment.")
    }
    func webViewWebContentProcessDidTerminate(_ webView:WKWebView){showFailure("The app page stopped. Return to Today and check your account before repeating a save or payment.")}
    func webView(_ webView:WKWebView,runJavaScriptAlertPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping()->Void){
        guard frame.securityOrigin.host == "shiftsometimber.co.uk",presentedViewController == nil else{completionHandler();return}
        let a=UIAlertController(title:"My Timber",message:message,preferredStyle:.alert)
        a.addAction(UIAlertAction(title:"OK",style:.default){_ in completionHandler()});present(a,animated:true)
    }
    func webView(_ webView:WKWebView,runJavaScriptConfirmPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping(Bool)->Void){
        guard frame.securityOrigin.host == "shiftsometimber.co.uk",presentedViewController == nil else{completionHandler(false);return}
        let a=UIAlertController(title:"My Timber",message:message,preferredStyle:.alert)
        a.addAction(UIAlertAction(title:"Cancel",style:.cancel){_ in completionHandler(false)})
        a.addAction(UIAlertAction(title:"Continue",style:.default){_ in completionHandler(true)});present(a,animated:true)
    }
    deinit{timer?.invalidate()}
}
