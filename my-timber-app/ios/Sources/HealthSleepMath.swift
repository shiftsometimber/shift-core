import Foundation

enum HealthSleepMath {
    // Sum actual asleep intervals in the latest episode, never two whole days.
    // Merge overlapping sources; exclude awake gaps from the duration.
    static func latestEpisodeMinutes(_ intervals:[[Double]]) -> Double? {
        let sorted=intervals.filter{$0.count==2 && $0[0].isFinite && $0[1].isFinite && $0[1]>$0[0]}.sorted{$0[0]<$1[0]}
        var merged:[[Double]]=[]
        for interval in sorted {
            if let last=merged.last,interval[0]<=last[1]{merged[merged.count-1][1]=max(last[1],interval[1])}
            else{merged.append(interval)}
        }
        guard let last=merged.last else{return nil}
        var start=last[0],seconds=last[1]-last[0]
        for interval in merged.dropLast().reversed(){
            if start-interval[1]>7200{break}
            seconds+=interval[1]-interval[0];start=interval[0]
        }
        let minutes=seconds/60;return minutes>0 && minutes<=1440 ? minutes : nil
    }
}
