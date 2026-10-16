#!/usr/bin/env python3
"""Compile the real Swift navigation/widget allowlists; no native UI/device claim."""
from pathlib import Path
import json,subprocess,tempfile
root=Path(__file__).resolve().parents[1]
cases=json.loads((root/'tests/navigation-cases.json').read_text())
mapping={'INTERNAL':'internalPage','EXTERNAL':'externalPage','DENY':'deny'}
routes={'mytimber://open/today':'https://shiftsometimber.co.uk/member/dashboard#today','mytimber://open/progress':'https://shiftsometimber.co.uk/member/dashboard#visualise','mytimber://open/grub':'https://shiftsometimber.co.uk/member/grub'}
invalid=['','mytimber://open','mytimber://open/today/','mytimber://open/Today','MYTIMBER://open/today','mytimber://open/today?token=x','mytimber://open/today#x','mytimber://open/progress?account=1','mytimber://open/grub/../today','mytimber://evil/today','https://shiftsometimber.co.uk/member/grub','javascript:alert(1)','mytimber://open/%74oday','mytimber://open/today%00','mytimber://user@open/today','mytimber://open:443/today','mytimber://open/treatment']
with tempfile.TemporaryDirectory(prefix='my-timber-widget-policy-') as tmp:
 p=Path(tmp);source='import Foundation\n'
 for raw,want in cases:source+='precondition(NavigationPolicy.classify('+json.dumps(raw)+') == .'+mapping[want]+')\n'
 for raw,destination in routes.items():source+='precondition(WidgetRoute.destination('+json.dumps(raw)+')?.absoluteString == '+json.dumps(destination)+')\n'
 for raw in invalid:source+='precondition(WidgetRoute.destination('+json.dumps(raw)+') == nil)\n'
 (p/'main.swift').write_text(source)
 subprocess.run(['swiftc',str(root/'ios/Sources/NavigationPolicy.swift'),str(root/'ios/Sources/WidgetRoute.swift'),str(p/'main.swift'),'-o',str(p/'check')],check=True)
 subprocess.run([str(p/'check')],check=True)
print(json.dumps({'originalNavigationCases':len(cases),'allowedWidgetRoutes':len(routes),'rejectedWidgetRoutes':len(invalid),'nativeUI':False,'physicalDevice':False}))
