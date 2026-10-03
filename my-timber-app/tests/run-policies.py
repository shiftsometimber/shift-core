#!/usr/bin/env python3
"""Compile and run the real Java and Swift navigation policies. No Android/iOS UI claim."""
import json, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/'tests/navigation-cases.json').read_text())
invalid_origins=['','https://shiftsometimber.co.uk','https://preview.shiftsometimber.co.uk','http://isolated-health-test.example','https://user@isolated-health-test.example','https://isolated-health-test.example/path','https://isolated-health-test.example?token=x','https://isolated-health-test.example#fragment','https://isolated-health-test.example:444','https://[::1]']
sleep_cases=[([[0,3600],[1800,5400]],90),([[0,3600],[5400,9000]],120),([[0,28800],[86400,115200]],480),([[0,28800],[50000,53600]],60),([[0,28800],[0,28800]],480),([],None),([[0,90000]],None),([[10,9]],None)]
with tempfile.TemporaryDirectory(prefix='my-timber-policy-') as tmp:
    p=Path(tmp)
    java='import uk.co.shiftsometimber.mytimber.NavigationPolicy;\nimport uk.co.shiftsometimber.mytimber.HealthSleepMath;\npublic class PolicyCheck {public static void main(String[] args){int count=0;\n'
    for raw,want in cases:
        literal=json.dumps(raw)
        java+=f'if(!NavigationPolicy.classify({literal}).name().equals("{want}"))throw new AssertionError("Case "+count);count++;\n'
    for origin in invalid_origins:
        java+=f'if(NavigationPolicy.configureHealthTestOrigin({json.dumps(origin)})||NavigationPolicy.healthTestingEnabled)throw new AssertionError("Unsafe test origin");count++;\n'
    java+='if(!NavigationPolicy.configureHealthTestOrigin("https://isolated-health-test.example"))throw new AssertionError("Test origin unavailable");\n'
    java+='if(NavigationPolicy.classify("https://isolated-health-test.example/member/dashboard")!=NavigationPolicy.Decision.INTERNAL||NavigationPolicy.classify("https://shiftsometimber.co.uk/member/dashboard")!=NavigationPolicy.Decision.EXTERNAL||NavigationPolicy.classify("https://isolated-health-test.example.evil/member/dashboard")!=NavigationPolicy.Decision.EXTERNAL)throw new AssertionError("Test origin isolation");count++;\n'
    for intervals,want in sleep_cases:
        values='new double[][]{'+','.join('{'+','.join(map(str,x))+'}' for x in intervals)+'}'
        check=f'Double.isNaN(HealthSleepMath.latestEpisodeMinutes({values}))' if want is None else f'Math.abs(HealthSleepMath.latestEpisodeMinutes({values})-{want})<0.000001'
        java+=f'if(!({check}))throw new AssertionError("Sleep interval integrity");count++;\n'
    java+='System.out.println("Java policy and sleep checks: "+count+" passed");}}\n'
    (p/'PolicyCheck.java').write_text(java)
    subprocess.run(['javac','--release','17','-d',tmp,str(ROOT/'android/app/src/main/java/uk/co/shiftsometimber/mytimber/NavigationPolicy.java'),str(ROOT/'android/app/src/main/java/uk/co/shiftsometimber/mytimber/HealthSleepMath.java'),str(p/'PolicyCheck.java')],check=True)
    subprocess.run(['java','-cp',tmp,'PolicyCheck'],check=True)
    swift='import Foundation\nvar count=0\n'
    mapping={'INTERNAL':'internalPage','EXTERNAL':'externalPage','DENY':'deny'}
    for raw,want in cases:
        literal=json.dumps(raw)
        swift+=f'precondition(NavigationPolicy.classify({literal}) == .{mapping[want]}, "Case \\(count)");count+=1\n'
    for origin in invalid_origins:
        swift+=f'precondition(!NavigationPolicy.configureHealthTestOrigin({json.dumps(origin)}) && !NavigationPolicy.healthTestingEnabled,"Unsafe test origin");count+=1\n'
    swift+='precondition(NavigationPolicy.configureHealthTestOrigin("https://isolated-health-test.example"))\n'
    swift+='precondition(NavigationPolicy.classify("https://isolated-health-test.example/member/dashboard") == .internalPage && NavigationPolicy.classify("https://shiftsometimber.co.uk/member/dashboard") == .externalPage && NavigationPolicy.classify("https://isolated-health-test.example.evil/member/dashboard") == .externalPage,"Test origin isolation");count+=1\n'
    for intervals,want in sleep_cases:
        values=json.dumps(intervals)
        check=f'HealthSleepMath.latestEpisodeMinutes({values}) == nil' if want is None else f'abs((HealthSleepMath.latestEpisodeMinutes({values}) ?? -1)-{want})<0.000001'
        swift+=f'precondition({check},"Sleep interval integrity");count+=1\n'
    swift+='print("Swift policy and sleep checks: \\(count) passed")\n'
    (p/'main.swift').write_text(swift)
    subprocess.run(['swiftc',str(ROOT/'ios/Sources/NavigationPolicy.swift'),str(ROOT/'ios/Sources/HealthSleepMath.swift'),str(p/'main.swift'),'-o',str(p/'policy')],check=True)
    subprocess.run([str(p/'policy')],check=True)
print(json.dumps({'javaPolicyAndSleepCasesPassed':len(cases)+len(invalid_origins)+1+len(sleep_cases),'swiftPolicyAndSleepCasesPassed':len(cases)+len(invalid_origins)+1+len(sleep_cases),'nativeUiCompiled':False,'deviceDeliveryTested':False}))
