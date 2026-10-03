package uk.co.shiftsometimber.mytimber;
import java.util.ArrayList;
import java.util.Comparator;

public final class HealthSleepMath {
    private HealthSleepMath() {}
    public static double latestEpisodeMinutes(double[][] intervals) {
        ArrayList<double[]> sorted=new ArrayList<>();
        for(double[] x:intervals)if(x.length==2&&Double.isFinite(x[0])&&Double.isFinite(x[1])&&x[1]>x[0])sorted.add(x.clone());
        sorted.sort(Comparator.comparingDouble(x->x[0]));ArrayList<double[]> merged=new ArrayList<>();
        for(double[] x:sorted){
            if(!merged.isEmpty()&&x[0]<=merged.get(merged.size()-1)[1])merged.get(merged.size()-1)[1]=Math.max(merged.get(merged.size()-1)[1],x[1]);
            else merged.add(x);
        }
        if(merged.isEmpty())return Double.NaN;
        double[] last=merged.get(merged.size()-1);double start=last[0],seconds=last[1]-last[0];
        for(int i=merged.size()-2;i>=0;i--){double[] x=merged.get(i);if(start-x[1]>7200)break;seconds+=x[1]-x[0];start=x[0];}
        double minutes=seconds/60;return minutes>0&&minutes<=1440?minutes:Double.NaN;
    }
}
