import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var privacyCover: UIView?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let controller = MyTimberViewController()
        if connectionOptions.urlContexts.count == 1,
           let url = connectionOptions.urlContexts.first?.url,
           let destination = WidgetRoute.destination(url.absoluteString) {
            controller.initialDestination = destination
        }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = controller
        self.window = window
        window.makeKeyAndVisible()

        let appDelegate = UIApplication.shared.delegate as? AppDelegate
        let opensTreatment = connectionOptions.notificationResponse?.notification.request.identifier.hasPrefix("my-timber-treatment-") == true
        if opensTreatment || appDelegate?.pendingTreatmentNavigation == true {
            appDelegate?.pendingTreatmentNavigation = false
            controller.loadViewIfNeeded()
            controller.openTreatment()
        }
    }

    func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
        guard contexts.count == 1,
              let url = contexts.first?.url,
              let destination = WidgetRoute.destination(url.absoluteString),
              let controller = window?.rootViewController as? MyTimberViewController else { return }
        controller.openWidgetDestination(destination)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        guard let window = window, privacyCover == nil else { return }
        let cover = UIView(frame: window.bounds)
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        cover.backgroundColor = UIColor(red: 5/255, green: 5/255, blue: 5/255, alpha: 1)
        window.addSubview(cover)
        privacyCover = cover
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        privacyCover?.removeFromSuperview()
        privacyCover = nil
    }
}
