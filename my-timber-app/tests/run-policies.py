#!/usr/bin/env python3
"""Compile and run the real Java and Swift navigation policies. No Android/iOS UI claim."""
import json, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/'tests/navigation-cases.json').read_text())
with tempfile.TemporaryDirectory(prefix='my-timber-policy-') as tmp:
    p=Path(tmp)
    java='import uk.co.shiftsometimber.mytimber.NavigationPolicy;\npublic class PolicyCheck {public static void main(String[] args){int count=0;\n'
    for raw,want in cases:
        literal=json.dumps(raw)
        java+=f'if(!NavigationPolicy.classify({literal}).name().equals("{want}"))throw new AssertionError("Case "+count);count++;\n'
    java+='System.out.println("Java policy: "+count+" passed");}}\n'
    (p/'PolicyCheck.java').write_text(java)
    subprocess.run(['javac','--release','17','-d',tmp,str(ROOT/'android/app/src/main/java/uk/co/shiftsometimber/mytimber/NavigationPolicy.java'),str(p/'PolicyCheck.java')],check=True)
    subprocess.run(['java','-cp',tmp,'PolicyCheck'],check=True)
    swift='import Foundation\nvar count=0\n'
    mapping={'INTERNAL':'internalPage','EXTERNAL':'externalPage','DENY':'deny'}
    for raw,want in cases:
        literal=json.dumps(raw)
        swift+=f'precondition(NavigationPolicy.classify({literal}) == .{mapping[want]}, "Case \\(count)");count+=1\n'
    swift+='print("Swift policy: \\(count) passed")\n'
    (p/'main.swift').write_text(swift)
    subprocess.run(['swiftc',str(ROOT/'ios/Sources/NavigationPolicy.swift'),str(p/'main.swift'),'-o',str(p/'policy')],check=True)
    subprocess.run([str(p/'policy')],check=True)
print(json.dumps({'javaPolicyCasesPassed':len(cases),'swiftPolicyCasesPassed':len(cases),'nativeUiCompiled':False,'deviceDeliveryTested':False}))
