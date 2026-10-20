import UIKit
import UserNotifications

@main final class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    var pendingTreatmentNavigation = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        if response.notification.request.identifier.hasPrefix("my-timber-treatment-") {
            DispatchQueue.main.async {
                let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
                let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
                if let controller = (scene?.delegate as? SceneDelegate)?.window?.rootViewController as? MyTimberViewController {
                    controller.openTreatment()
                } else {
                    self.pendingTreatmentNavigation = true
                }
            }
        }
        completionHandler()
    }
}
