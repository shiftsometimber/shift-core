package uk.co.shiftsometimber.mytimber;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.widget.*;
public final class PermissionsRationaleActivity extends Activity {
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(32,48,32,32);
  TextView copy=new TextView(this);copy.setText("My Timber health imports\n\nWith your permission, My Timber reads heart rate, blood pressure and weight from Health Connect. You preview readings and choose what to save to your private My Timber account.\n\nNo background collection or writes to Health Connect. This is personal progress tracking, not clinical monitoring. Readings are not used for advertising or employer reports.\n\nDisconnect imports or delete imported copies in My Timber Settings. Revoke phone access in Health Connect. Export and erase controls are available in My Timber.");copy.setTextSize(18);root.addView(copy);
  Button policy=new Button(this);policy.setText("Read the privacy policy");policy.setOnClickListener(v->startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://shiftsometimber.co.uk/privacy"))));root.addView(policy);setContentView(root);
 }
}
