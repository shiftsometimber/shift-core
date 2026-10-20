import SwiftUI
import WidgetKit

struct TimberEntry: TimelineEntry { let date: Date }
struct TimberProvider: TimelineProvider {
    func placeholder(in context: Context) -> TimberEntry { TimberEntry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (TimberEntry) -> Void) { completion(TimberEntry(date: Date())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<TimberEntry>) -> Void) {
        completion(Timeline(entries: [TimberEntry(date: Date())], policy: .never))
    }
}
struct TimberWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TimberEntry
    private let cream = Color(red: 231/255, green: 227/255, blue: 218/255)
    private let black = Color(red: 5/255, green: 5/255, blue: 5/255)
    private func shortcut(_ title: String, _ route: String, _ symbol: String) -> some View {
        Link(destination: URL(string: "mytimber://open/" + route)!) {
            Label(title, systemImage: symbol).font(.subheadline.weight(.semibold)).padding(.vertical, 8)
        }.accessibilityLabel("Open " + title + " in My Timber")
    }
    private var content: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("MY TIMBER").font(.caption.weight(.bold)).foregroundColor(cream)
            if family == .systemSmall {
                Image(systemName: "arrow.up.right").font(.title2)
                Text("Open Today").font(.headline)
                Text("One useful step").font(.caption)
            } else {
                HStack(spacing: 18) {
                    shortcut("Today", "today", "sun.max")
                    shortcut("Progress", "progress", "chart.xyaxis.line")
                    shortcut("Grub", "grub", "fork.knife")
                }
                Text("Your records stay inside the app.").font(.caption)
            }
        }.foregroundColor(cream).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
    var body: some View {
        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(black, for: .widget).widgetURL(URL(string: "mytimber://open/today")!)
        } else {
            content.padding().background(black).widgetURL(URL(string: "mytimber://open/today")!)
        }
    }
}
@main struct MyTimberWidget: Widget {
    let kind = "MyTimberShortcuts"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TimberProvider()) { entry in TimberWidgetView(entry: entry) }
            .configurationDisplayName("My Timber")
            .description("Open Today, Progress or Grub. Personal records appear only inside the app.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}
