package uk.co.shiftsometimber.mytimber;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.Gravity;
import android.view.View;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;

/** Approved native startup: exact supplied S mark + official SHIFT wordmark. */
public final class StartupOverlay extends FrameLayout {
    private static final int BLACK=Color.rgb(5,5,5);
    private static final int GREEN=Color.rgb(112,119,98);
    private final ImageView mark;
    private final ImageView wordmark;
    private final SwirlView swirl;

    public StartupOverlay(Context context) {
        super(context);
        setBackgroundColor(BLACK);
        setClickable(true);
        setFocusable(true);

        swirl=new SwirlView(context);
        addView(swirl,new LayoutParams(LayoutParams.MATCH_PARENT,LayoutParams.MATCH_PARENT));

        mark=new ImageView(context);
        mark.setImageResource(R.drawable.my_timber_icon);
        mark.setScaleType(ImageView.ScaleType.FIT_CENTER);
        mark.setAlpha(0f);
        LayoutParams mp=new LayoutParams(dp(300),dp(300),Gravity.CENTER);
        mp.bottomMargin=dp(115);
        addView(mark,mp);

        wordmark=new ImageView(context);
        wordmark.setImageResource(R.drawable.sst_logo_official);
        wordmark.setScaleType(ImageView.ScaleType.FIT_CENTER);
        wordmark.setAlpha(0f);
        LayoutParams wp=new LayoutParams(LayoutParams.MATCH_PARENT,dp(170),Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL);
        wp.leftMargin=dp(34);wp.rightMargin=dp(34);wp.bottomMargin=dp(175);
        addView(wordmark,wp);
    }

    @Override protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        postDelayed(this::animateIn,80);
    }

    private void animateIn() {
        mark.setScaleX(.94f);mark.setScaleY(.94f);
        mark.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(320)
            .setInterpolator(new DecelerateInterpolator()).start();
        postDelayed(()->swirl.start(),350);
        postDelayed(()->wordmark.animate().alpha(1f).setDuration(280).start(),830);
        postDelayed(()->{
            mark.animate().alpha(0f).setDuration(240).start();
            wordmark.animate().alpha(0f).setDuration(240).start();
            swirl.animate().alpha(0f).setDuration(240).start();
        },1480);
        postDelayed(()->animate().alpha(0f).setDuration(480).withEndAction(()->{
            setVisibility(GONE);
            if(getParent() instanceof android.view.ViewGroup)((android.view.ViewGroup)getParent()).removeView(this);
        }).start(),1680);
    }

    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}

    private static final class SwirlView extends View {
        private final Paint strong=new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint soft=new Paint(Paint.ANTI_ALIAS_FLAG);
        private float progress=0f;
        SwirlView(Context c){
            super(c);
            strong.setStyle(Paint.Style.STROKE);strong.setStrokeWidth(dp(c,5));strong.setColor(GREEN);strong.setAlpha(145);
            soft.setStyle(Paint.Style.STROKE);soft.setStrokeWidth(dp(c,3));soft.setColor(GREEN);soft.setAlpha(72);
            setAlpha(0f);
        }
        void start(){
            setAlpha(1f);
            ValueAnimator a=ValueAnimator.ofFloat(0f,1f);a.setDuration(950);a.setInterpolator(new DecelerateInterpolator());
            a.addUpdateListener(v->{progress=(float)v.getAnimatedValue();invalidate();});a.start();
        }
        @Override protected void onDraw(Canvas c){
            super.onDraw(c);
            float cx=getWidth()/2f,cy=getHeight()/2f-dp(getContext(),58);
            float r1=dp(getContext(),185),r2=dp(getContext(),220);
            c.drawArc(new RectF(cx-r1,cy-r1,cx+r1,cy+r1),-110+360*progress,125,false,strong);
            c.drawArc(new RectF(cx-r2,cy-r2,cx+r2,cy+r2),-5+360*progress,125,false,soft);
        }
        private static int dp(Context c,int v){return Math.round(v*c.getResources().getDisplayMetrics().density);}
    }
}
