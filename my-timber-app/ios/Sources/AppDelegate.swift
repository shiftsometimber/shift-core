import UIKit

@main final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    private var privacyCover: UIView?
    func application(_ application:UIApplication,didFinishLaunchingWithOptions launchOptions:[UIApplication.LaunchOptionsKey:Any]?) -> Bool {
        let w=UIWindow(frame:UIScreen.main.bounds)
        w.rootViewController=MyTimberViewController()
        w.makeKeyAndVisible();window=w
        return true
    }
    func applicationWillResignActive(_ application:UIApplication) {
        guard let window=window else{return}
        let cover=UIView(frame:window.bounds)
        cover.autoresizingMask=[.flexibleWidth,.flexibleHeight]
        cover.backgroundColor=UIColor(red:5/255,green:5/255,blue:5/255,alpha:1)
        window.addSubview(cover);privacyCover=cover
    }
    func applicationDidBecomeActive(_ application:UIApplication) {privacyCover?.removeFromSuperview();privacyCover=nil}
}
