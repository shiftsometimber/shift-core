import UIKit

/// Approved native startup: exact supplied S mark + official SHIFT wordmark.
final class StartupOverlay: UIView {
    private let mark=UIImageView()
    private let wordmark=UIImageView()
    private let swirl=SwirlView()

    override init(frame:CGRect){
        super.init(frame:frame)
        backgroundColor=UIColor(red:5/255,green:5/255,blue:5/255,alpha:1)
        isUserInteractionEnabled=true
        swirl.translatesAutoresizingMaskIntoConstraints=false
        addSubview(swirl)

        mark.image=UIImage(named:"my-timber-icon")
        mark.contentMode = .scaleAspectFit
        mark.alpha=0
        mark.translatesAutoresizingMaskIntoConstraints=false
        addSubview(mark)

        wordmark.image=UIImage(named:"sst-logo-official")
        wordmark.contentMode = .scaleAspectFit
        wordmark.alpha=0
        wordmark.translatesAutoresizingMaskIntoConstraints=false
        addSubview(wordmark)

        NSLayoutConstraint.activate([
            swirl.leadingAnchor.constraint(equalTo:leadingAnchor),swirl.trailingAnchor.constraint(equalTo:trailingAnchor),
            swirl.topAnchor.constraint(equalTo:topAnchor),swirl.bottomAnchor.constraint(equalTo:bottomAnchor),
            mark.widthAnchor.constraint(equalTo:widthAnchor,multiplier:0.46),
            mark.heightAnchor.constraint(equalTo:mark.widthAnchor),
            mark.centerXAnchor.constraint(equalTo:centerXAnchor),
            mark.centerYAnchor.constraint(equalTo:centerYAnchor,constant:-55),
            wordmark.leadingAnchor.constraint(equalTo:leadingAnchor,constant:34),
            wordmark.trailingAnchor.constraint(equalTo:trailingAnchor,constant:-34),
            wordmark.heightAnchor.constraint(equalToConstant:170),
            wordmark.bottomAnchor.constraint(equalTo:safeAreaLayoutGuide.bottomAnchor,constant:-115)
        ])
    }
    required init?(coder:NSCoder){fatalError("init(coder:) has not been implemented")}

    func playAndRemove(){
        mark.transform=CGAffineTransform(scaleX:0.94,y:0.94)
        UIView.animate(withDuration:0.32,delay:0.08,options:[.curveEaseOut]){
            self.mark.alpha=1;self.mark.transform = .identity
        }
        DispatchQueue.main.asyncAfter(deadline:.now()+0.35){self.swirl.start()}
        UIView.animate(withDuration:0.28,delay:0.83){self.wordmark.alpha=1}
        UIView.animate(withDuration:0.24,delay:1.48){
            self.mark.alpha=0;self.wordmark.alpha=0;self.swirl.alpha=0
        }
        UIView.animate(withDuration:0.48,delay:1.68,options:[.curveEaseOut],animations:{self.alpha=0}){_ in
            self.removeFromSuperview()
        }
    }

    private final class SwirlView:UIView {
        private let strong=CAShapeLayer(),soft=CAShapeLayer()
        override init(frame:CGRect){
            super.init(frame:frame);backgroundColor = .clear;alpha=0
            for (layer,width,opacity) in [(strong,5.0,0.57),(soft,3.0,0.28)] {
                layer.fillColor=UIColor.clear.cgColor
                layer.strokeColor=UIColor(red:112/255,green:119/255,blue:98/255,alpha:opacity).cgColor
                layer.lineWidth=width;layer.lineCap = .round;self.layer.addSublayer(layer)
            }
        }
        required init?(coder:NSCoder){fatalError("init(coder:) has not been implemented")}
        override func layoutSubviews(){
            super.layoutSubviews()
            let c=CGPoint(x:bounds.midX,y:bounds.midY-55)
            strong.path=UIBezierPath(arcCenter:c,radius:min(bounds.width*0.31,260),startAngle:-1.92,endAngle:0.26,clockwise:true).cgPath
            soft.path=UIBezierPath(arcCenter:c,radius:min(bounds.width*0.37,305),startAngle:-0.09,endAngle:2.09,clockwise:true).cgPath
        }
        func start(){
            alpha=1
            for (layer,delay) in [(strong,0.0),(soft,0.10)] {
                let a=CABasicAnimation(keyPath:"transform.rotation")
                a.fromValue=0;a.toValue=Double.pi*2;a.duration=0.95;a.beginTime=CACurrentMediaTime()+delay
                a.timingFunction=CAMediaTimingFunction(name:.easeOut);a.isRemovedOnCompletion=false;a.fillMode = .forwards
                layer.add(a,forKey:"startup-swirl")
            }
        }
    }
}
