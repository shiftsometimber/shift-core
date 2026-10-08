import UIKit
import UserNotifications

@main final class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    var window: UIWindow?
    private var privacyCover: UIView?
    func application(_ application:UIApplication,didFinishLaunchingWithOptions launchOptions:[UIApplication.LaunchOptionsKey:Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate=self
        let w=UIWindow(frame:UIScreen.main.bounds)
        w.rootViewController=MyTimberViewController()
        w.makeKeyAndVisible();window=w
        return true
    }
    func userNotificationCenter(_ center:UNUserNotificationCenter,willPresent notification:UNNotification,withCompletionHandler completionHandler:@escaping(UNNotificationPresentationOptions)->Void){completionHandler([.banner,.sound])}
    func userNotificationCenter(_ center:UNUserNotificationCenter,didReceive response:UNNotificationResponse,withCompletionHandler completionHandler:@escaping()->Void){
        if response.notification.request.identifier.hasPrefix("my-timber-treatment-"){(window?.rootViewController as? MyTimberViewController)?.openTreatment()};completionHandler()
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
