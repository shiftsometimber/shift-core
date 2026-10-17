"""Unbound, pure source adapter for one independently admitted GP top frame.

The caller must obtain expected_source_blob from its independently admitted
accepted source, not by hashing an arbitrary working file. This module neither
admits a source nor creates a Git graph. The returned inverse restores every
original source byte; actual aggregate admission remains a separate proof.
"""
from __future__ import annotations

import hashlib

IMPORT = "import {codingCompletionHistoricalView,assertCodingCompletionView} from './coding-completion-scope-20261016.mjs';\n"
KINDS = {
    "activation": {
        "path": "release/gp-directory-activation-20261015.mjs",
        "key": "gpDirectoryActivation20261015",
        "verify": "verifyGpDirectoryActivation",
        "factory": "gpDirectoryActivationHistoricalView",
        "guard": "fresh", "views": "views", "readers": "readers",
    },
    "code_off": {
        "path": "release/gp-member-code-admission-20261014.mjs",
        "key": "gpMemberCode20261014",
        "verify": "verifyGpCodeStack",
        "factory": "gpMemberCodeHistoricalView",
        "guard": "assertUnchangedRaw", "views": "admittedViews", "readers": "admittedReaders",
    },
}


def git_blob(text: str) -> str:
    data = text.encode()
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def select_top(ledger: dict) -> dict:
    assert ledger.get("myTimberRecordedWeekActivation20261014"), "Independently admitted factual W predecessor required"
    gp = ledger.get("gpMemberCode20261014")
    assert gp and gp.get("flagsEnabled") is False, "Original code-only GP record must remain flags-OFF"
    activation = ledger.get("gpDirectoryActivation20261015")
    kind = "activation" if activation else "code_off"
    if activation:
        assert activation.get("flagsEnabled") is True, "Exact separately admitted activation record required"
    return {"kind": kind, **KINDS[kind], "omit_seo_adapter": True,
            "preserve_w_csv_test_byte_exact": True,
            "requires_independently_admitted_expected_source_blob": True}


def _suffix(kind: str) -> str:
    spec = KINDS[kind]
    verify, factory, guard = spec["verify"], spec["factory"], spec["guard"]
    native = "gpBeforeCodingNativeFacts"
    public_verify = f"""
export function {verify}(c{',options={}' if kind == 'code_off' else ''}){{
 const outer=codingCompletionHistoricalView();
 if(!outer)return {verify}BeforeCodingCompletion(c{',options' if kind == 'code_off' else ''});
 assertCodingCompletionView(outer);assert.deepEqual(c,outer.record[key],'Coding-completion source drift: exact admitted GP predecessor record required');
 const frame=gpBeforeCodingFrame(outer);
"""
    if kind == "code_off":
        public_verify += """ assert.equal(options.head===undefined?outer.rawHead:options.head,outer.rawHead,'Coding-completion source drift: actual raw HEAD required');
 for(const name of['read','readContent','readDiff','isAncestor'])if(options[name]!==undefined)assert.equal(typeof options[name],'function','Supplied GP callback must remain a function');
 try{return verifyGpCodeStackBeforeCodingCompletion(c,{head:outer.head,
  read:options.read===undefined?frame.blob:outer.projectRead(options.read),
  readContent:options.readContent===undefined?frame.content:outer.projectContent(options.readContent),
  readDiff:options.readDiff===undefined?frame.diff:outer.projectDiff(options.readDiff),
  isAncestor:options.isAncestor===undefined?frame.ancestor:outer.projectAncestor(options.isAncestor)},frame);
 }finally{outer.assertCurrent();}
}
"""
    else:
        public_verify += """ try{return verifyGpDirectoryActivationBeforeCodingCompletion(c,frame);}finally{outer.assertCurrent();}
}
"""
    register = ""
    if kind == "code_off":
        register = ",...(kind==='read'?{nativeSource:reader===null&&outer.nativeSource===true&&gpCodeReaderProvenance(inner.read)?.nativeSource===true}:{})"
    return f"""
// One outer, independently admitted coding-completion frame. The original
// GP proof and supplied-callback bodies above restore byte for byte.
const {native}=Object.freeze({{currentHead,blob,content,diff,ancestor,mode,clean,{guard}}});
function gpBeforeCodingFrame(outer){{
 assertCodingCompletionView(outer);
 const run=f=>{{assertCodingCompletionView(outer);try{{return f();}}finally{{assertCodingCompletionView(outer);}}}},ref=r=>r==='HEAD'||r===outer.rawHead?outer.head:r;
 return Object.freeze({{
  assertCurrentHead,
  currentHead:()=>run(()=>outer.head),
  blob:(r,p)=>run(()=>outer.blob(r,p)),content:(r,p)=>run(()=>outer.content(r,p)),
  diff:(a,b)=>run(()=>outer.diff(a,b)),ancestor:(a,b)=>run(()=>outer.ancestor(a,b)),
  mode:(r,p)=>run(()=>{native}.mode(ref(r),p)),
  clean:()=>run(()=>{native}.clean()),
  {guard}:expected=>run(()=>{{assert.equal(expected,outer.head,'Coding-completion source drift: exact projected GP head required');{native}.{guard}(outer.rawHead);}})
 }});
}}
{public_verify}
export function {factory}(reader=null,{{defaultReader=reader===null}}={{}}){{
 if(reader!==null)assert.equal(typeof reader,'function','Supplied GP reader must remain a function');
 const outer=codingCompletionHistoricalView(reader);
 if(!outer)return {factory}BeforeCodingCompletion(reader,{{defaultReader}});
 assertCodingCompletionView(outer);assert(outer.record[key],'Coding-completion source drift: admitted GP predecessor required');
 const frame=gpBeforeCodingFrame(outer),inner={factory}BeforeCodingCompletion(reader===null?null:outer.projectRead(reader),{{defaultReader}},frame),ref=r=>r===outer.rawHead?'HEAD':r;
 const assertCurrent=()=>{{assertCodingCompletionView(outer);inner.assertCurrent();assertCodingCompletionView(outer);}},run=f=>{{assertCurrent();try{{return f();}}finally{{assertCurrent();}}}};
 const view={{...inner,rawHead:outer.rawHead,affected:p=>outer.affected(p)||inner.affected(p),assertCurrent,
  authentic:(v,r,p,h=outer.rawHead)=>run(()=>authentic(v,r,p,h)),
  nativeAuthentic:(v,r,p)=>run(()=>authentic(v,r,p,r==='HEAD'?outer.rawHead:r)),
  nativeContentAuthentic:(v,r,p)=>run(()=>authenticContent(v,r,p,r==='HEAD'?outer.rawHead:r)),
  read:(r,p)=>run(()=>inner.read(ref(r),p)),blob:(r,p)=>run(()=>inner.blob(ref(r),p)),content:(r,p)=>run(()=>inner.content(ref(r),p)),
  diff:(a,b)=>run(()=>inner.diff(ref(a),ref(b))),ancestor:(a,b)=>run(()=>inner.ancestor(ref(a),ref(b))),
  currentContent:(r,p)=>run(()=>outer.currentContent(r,p)),codingCompletionContext:outer}};
 {spec['views']}.add(view);Object.freeze(view);for(const kind of['read','blob','content','diff','ancestor']){spec['readers']}.set(view[kind],Object.freeze({{kind,view{register}}}));view.assertCurrent();return view;
}}
"""


def transform(source: str, *, expected_source_blob: str, kind: str) -> dict:
    assert kind in KINDS, "Only original activation or original code-only GP top is supported"
    assert len(expected_source_blob) == 40 and git_blob(source) == expected_source_blob, "Exact independently admitted GP source blob required"
    assert IMPORT not in source, "An aggregate top frame is already present"
    spec = KINDS[kind]
    inverses: list[list[str]] = []
    text = source

    def change(before: str, after: str) -> None:
        nonlocal text
        assert before and text.count(before) == 1, "One exact original GP source anchor required: " + before[:100]
        text = text.replace(before, after, 1)
        inverses.append([before, after])

    facts = "const {currentHead,blob,content,diff,ancestor,mode,clean," + spec["guard"] + "}=privateCoding??gpBeforeCodingNativeFacts;"
    if kind == "activation":
        change("export function verifyGpDirectoryActivation(c){", "function verifyGpDirectoryActivationBeforeCodingCompletion(c,privateCoding=null){\n " + facts)
        change("export function gpDirectoryActivationHistoricalView(reader=null,{defaultReader=reader===null}={}){", "function gpDirectoryActivationHistoricalViewBeforeCodingCompletion(reader=null,{defaultReader=reader===null}={},privateCoding=null){\n " + facts)
        change("if(c)verifyGpDirectoryActivation(c);else clean();", "if(c)verifyGpDirectoryActivationBeforeCodingCompletion(c,privateCoding);else clean();")
    else:
        change("export function verifyGpCodeStack(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={}){", "function verifyGpCodeStackBeforeCodingCompletion(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={},privateCoding=null){\n " + facts)
        change("export function gpMemberCodeHistoricalView(reader=null,{defaultReader=reader===null}={}){", "function gpMemberCodeHistoricalViewBeforeCodingCompletion(reader=null,{defaultReader=reader===null}={},privateCoding=null){\n " + facts)
        change("if(c)verifyGpCodeStack(c,{head:rawHead});", "if(c)verifyGpCodeStackBeforeCodingCompletion(c,{head:rawHead,...(privateCoding?{read:privateCoding.blob,readContent:privateCoding.content,readDiff:privateCoding.diff,isAncestor:privateCoding.ancestor}:{})},privateCoding);")
    text = IMPORT + text
    inverses.insert(0, ["", IMPORT])
    suffix = _suffix(kind)
    text += suffix
    inverses.append(["", suffix])
    restored = inverse(text, inverses)
    assert restored == source and git_blob(restored) == expected_source_blob, "Whole original GP top source must restore"
    return {"text": text, "inverses": inverses, "kind": kind,
            "path": spec["path"], "key": spec["key"], "original_blob": expected_source_blob,
            "prepared_blob": git_blob(text), "prepared_sha256": hashlib.sha256(text.encode()).hexdigest(),
            "whole_inverse_verified": True, "source_admitted": False,
            "required_original_tests": ["All original GP stack/admission/source/HQ/W checks unchanged", "All original 39 activation fixtures when activation top is selected", "Actual aggregate source inverse and current-supplied callback/HEAD drift cases"]}


def inverse(text: str, pairs: list[list[str]]) -> str:
    for before, after in reversed(pairs):
        assert after and text.count(after) == 1, "One whole-source inverse required"
        text = text.replace(after, before, 1)
    return text

# Exact current-runtime-preservation successor. No existing GP transform changes.
_previous_select_top=select_top
_previous_transform=transform
CURRENT_SPEC={"kind":"preservation","path":"release/current-runtime-preservation-20261016.mjs","key":"currentRuntimePreservation20261016","omit_seo_adapter":True,"preserve_w_csv_test_byte_exact":True,"requires_independently_admitted_expected_source_blob":True}
def select_top(ledger):
    if "currentRuntimePreservation20261016" not in ledger:return _previous_select_top(ledger)
    assert ledger.get("gpDirectoryActivation20261015",{}).get("flagsEnabled") is True,"Preserve exact delivered GP ON record"
    assert ledger["currentRuntimePreservation20261016"].get("runtimeSource"),"Actual current runtime source required"
    return dict(CURRENT_SPEC)
def transform(source,*,expected_source_blob,kind):
    if kind!="preservation":return _previous_transform(source,expected_source_blob=expected_source_blob,kind=kind)
    import re
    assert git_blob(source)==expected_source_blob and len(expected_source_blob)==40,"Exact frozen current source required"
    assert IMPORT not in source,"No competing outer source frame"
    policy=re.search(r"^const policy=\{[^\n]+\};\n",source,re.M)
    assert policy,"Complete original policy required"
    token="// EXACT_ORIGINAL_CURRENT_PRESERVATION_POLICY\n"
    original_policy=policy.group(0);text=source.replace(original_policy,token,1);pairs=[]
    facts=" const {currentHead,blob,content,diff,ancestor,mode,clean,authentic,authenticContent}=privateCoding??preservationBeforeCodingNativeFacts;\n"
    def change(before,after):
        nonlocal text
        assert text.count(before)==1,"Exact unique current-source anchor required: "+before[:100]
        text=text.replace(before,after,1);pairs.append([before,after])
    change("export function verifyCurrentRuntimePreservation(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={}){","function verifyCurrentRuntimePreservationBeforeCoding(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={},privateCoding=null){\n"+facts)
    change("const facts=currentPreservationNativeFacts(c,head),verifiedBlob=facts.blob,verifiedContent=facts.content;", "const facts=privateCoding?privateCoding.nativeFacts(c,head):currentPreservationNativeFacts(c,head),verifiedBlob=facts.blob,verifiedContent=facts.content;")
    change(" const assertCurrentHead=()=>{\n  if(immutableHistorySourceHead()!==rawHead)return assertCurrent();", " const assertCurrentHead=()=>{\n  if(privateCoding)return privateCoding.assertCurrentHead();\n  if(immutableHistorySourceHead()!==rawHead)return assertCurrent();")
    change("export function currentRuntimePreservationHistoricalView(reader=null,{defaultReader=reader===null}={}){","function currentRuntimePreservationHistoricalViewBeforeCoding(reader=null,{defaultReader=reader===null}={},privateCoding=null){\n"+facts)
    change("if(c)verifyCurrentRuntimePreservation(c,{head:rawHead});","if(c)verifyCurrentRuntimePreservationBeforeCoding(c,{head:rawHead,read:blob,readContent:content,readDiff:diff,isAncestor:ancestor},privateCoding);")
    change("import assert from 'node:assert/strict';",IMPORT+"import assert from 'node:assert/strict';")
    suffix="""
// One authenticated outer coding frame. Every previous assertion and policy
// restores exactly; supplied readers still authenticate actual current source.
const preservationBeforeCodingNativeFacts=Object.freeze({currentHead,blob,content,diff,ancestor,mode,clean,authentic,authenticContent});
function preservationBeforeCodingFrame(outer){
 assertCodingCompletionView(outer);
 const assertCurrentHead=()=>{
  if(immutableHistorySourceHead()!==outer.rawHead)return assertCodingCompletionView(outer);
  return withImmutableHistoryVerification(()=>assert.equal(preservationBeforeCodingNativeFacts.currentHead(),outer.rawHead,'Actual raw HEAD changed during native coding projection'));
 };
 const run=f=>{const closed=immutableHistorySourceHead()===outer.rawHead;if(!closed)assertCodingCompletionView(outer);try{return withImmutableHistoryVerification(()=>{assertCurrentHead();try{return f();}finally{assertCurrentHead();}});}finally{if(!closed)assertCodingCompletionView(outer);}},ref=r=>r==='HEAD'||r===outer.rawHead?outer.head:r;
 return Object.freeze({
  assertCurrentHead,
  currentHead:()=>run(()=>outer.rawHead),
  blob:(r,p)=>run(()=>outer.blob(r,p)),content:(r,p)=>run(()=>outer.content(r,p)),
  diff:(a,b)=>run(()=>outer.diff(a,b)),ancestor:(a,b)=>run(()=>outer.ancestor(a,b)),
  mode:(r,p)=>run(()=>preservationBeforeCodingNativeFacts.mode(ref(r),p)),
  clean:()=>run(()=>preservationBeforeCodingNativeFacts.clean()),
  authentic:(value,r,p,h=outer.rawHead)=>run(()=>preservationBeforeCodingNativeFacts.authentic(value,r,p,ref(h))),
  authenticContent:(value,r,p,h=outer.rawHead)=>run(()=>preservationBeforeCodingNativeFacts.authenticContent(value,r,p,ref(h))),
  bindRead:(source,kind='read')=>(r,p)=>run(()=>{
   const value=source(r,p),actual=r==='HEAD'?outer.rawHead:r;
   if(kind==='content')assert(preservationBeforeCodingNativeFacts.authenticContent(value,r,p,actual),'Unauthentic supplied current content');
   else assert(preservationBeforeCodingNativeFacts.authentic(value,r,p,actual),'Unauthentic supplied current source');
   if(r!=='HEAD'&&r!==outer.rawHead)return value;
   // Preserve the callback's native blob/content representation; a content
   // result must never be silently converted into a valid blob identifier.
   if(kind==='read'&&value===preservationBeforeCodingNativeFacts.blob(actual,p))return outer.blob(r,p);
   return outer.content(r,p);
  }),
  bindDiff:source=>(a,b)=>run(()=>{
   const value=source(a,b);assert.deepEqual(sorted(value),sorted(preservationBeforeCodingNativeFacts.diff(a,b)),'Unauthentic supplied current diff');
   return a==='HEAD'||a===outer.rawHead||b==='HEAD'||b===outer.rawHead?outer.diff(a,b):value;
  }),
  bindAncestor:source=>(a,b)=>run(()=>{
   const value=source(a,b);preservationBeforeCodingNativeFacts.ancestor(a,b);assert.notEqual(value,false,'Unauthentic supplied current ancestry');
   if(a==='HEAD'||a===outer.rawHead||b==='HEAD'||b===outer.rawHead)outer.ancestor(a,b);return value;
  }),
  nativeFacts:(record,head)=>run(()=>{
   assert.equal(head,outer.rawHead,'Actual raw HEAD required for native facts');
   const captured=currentPreservationNativeFacts(record,outer.head);
   return Object.freeze({
    blob:(r,p)=>run(()=>captured.blob(ref(r),p)),
    content:(r,p)=>run(()=>captured.content(ref(r),p)),
    mode:(r,p)=>run(()=>captured.mode(ref(r),p))
   });
  })
 });
}
function withCodingConstructionProof(run){
 const actual=currentHead();clean();
 try{return withImmutableHistoryVerification(run);}
 finally{clean();assert.equal(currentHead(),actual,'Actual raw HEAD moved during coding construction');}
}
export function verifyCurrentRuntimePreservation(c,options={}){
 return withCodingConstructionProof(()=>verifyCurrentRuntimePreservationInCodingProof(c,options));
}
function verifyCurrentRuntimePreservationInCodingProof(c,options={}){
 const outer=codingCompletionHistoricalView();
 if(!outer)return verifyCurrentRuntimePreservationBeforeCoding(c,options);
 assertCodingCompletionView(outer);assert.deepEqual(c,outer.record[key],'Exact current-runtime predecessor record required');
 assert.equal(options.head===undefined?outer.rawHead:options.head,outer.rawHead,'Actual raw HEAD required');
 for(const name of['read','readContent','readDiff','isAncestor'])if(options[name]!==undefined)assert.equal(typeof options[name],'function','Supplied callback must remain a function');
 const frame=preservationBeforeCodingFrame(outer);
 try{return verifyCurrentRuntimePreservationBeforeCoding(c,{
  head:outer.rawHead,
  read:options.read===undefined?frame.blob:frame.bindRead(options.read),
  readContent:options.readContent===undefined?frame.content:frame.bindRead(options.readContent,'content'),
  readDiff:options.readDiff===undefined?frame.diff:frame.bindDiff(options.readDiff),
  isAncestor:options.isAncestor===undefined?frame.ancestor:frame.bindAncestor(options.isAncestor)
 },frame);}finally{outer.assertCurrent();}
}
export function currentRuntimePreservationHistoricalView(reader=null,{defaultReader=reader===null}={}){
 return withCodingConstructionProof(()=>currentRuntimePreservationHistoricalViewInCodingProof(reader,{defaultReader}));
}
function currentRuntimePreservationHistoricalViewInCodingProof(reader=null,{defaultReader=reader===null}={}){
 if(reader!==null)assert.equal(typeof reader,'function','Supplied current-runtime reader must remain a function');
 const outer=codingCompletionHistoricalView(reader);
 if(!outer)return currentRuntimePreservationHistoricalViewBeforeCoding(reader,{defaultReader});
 assertCodingCompletionView(outer);assert(outer.record[key],'Exact current-runtime predecessor record required');
 const frame=preservationBeforeCodingFrame(outer),inner=currentRuntimePreservationHistoricalViewBeforeCoding(reader===null?null:frame.bindRead(reader),{defaultReader},frame),ref=r=>r;
 const assertCurrent=()=>{assertCodingCompletionView(outer);inner.assertCurrent();assertCodingCompletionView(outer);},assertCurrentHead=()=>{inner.assertCurrentHead();},run=f=>{const closed=immutableHistorySourceHead()===outer.rawHead;if(!closed)assertCodingCompletionView(outer);try{return withImmutableHistoryVerification(()=>{assertCurrentHead();try{return f();}finally{assertCurrentHead();}});}finally{if(!closed)assertCodingCompletionView(outer);}};
 const view={...inner,rawHead:outer.rawHead,affected:p=>outer.affected(p)||inner.affected(p),assertCurrent,assertCurrentHead,
  authentic:(v,r,p,h=outer.rawHead)=>run(()=>authentic(v,r,p,h)),
  nativeAuthentic:(v,r,p)=>run(()=>authentic(v,r,p,r==='HEAD'?outer.rawHead:r)),
  nativeContentAuthentic:(v,r,p)=>run(()=>authenticContent(v,r,p,r==='HEAD'?outer.rawHead:r)),
  read:(r,p)=>run(()=>inner.read(ref(r),p)),blob:(r,p)=>run(()=>inner.blob(ref(r),p)),content:(r,p)=>run(()=>inner.content(ref(r),p)),
  diff:(a,b)=>run(()=>inner.diff(ref(a),ref(b))),ancestor:(a,b)=>run(()=>inner.ancestor(ref(a),ref(b))),
  currentContent:(r,p)=>run(()=>outer.currentContent(r,p)),codingCompletionContext:outer};
 admittedViews.add(view);Object.freeze(view);
 for(const kind of['read','blob','content','diff','ancestor'])admittedReaders.set(view[kind],Object.freeze({kind,view,...(kind==='read'?{nativeSource:reader===null&&outer.nativeSource===true&&currentRuntimePreservationReaderProvenance(inner.read)?.nativeSource===true}:{})}));
 view.assertCurrent();return view;
}
"""
    text+=suffix;pairs.append(["",suffix]);assert text.count(token)==1;text=text.replace(token,original_policy,1)
    assert inverse(text,pairs)==source and git_blob(inverse(text,pairs))==expected_source_blob,"Every original current-runtime byte must restore"
    return {"text":text,"inverses":pairs,"kind":kind,"path":CURRENT_SPEC["path"],"key":CURRENT_SPEC["key"],"original_blob":expected_source_blob,"prepared_blob":git_blob(text),"prepared_sha256":hashlib.sha256(text.encode()).hexdigest(),"whole_inverse_verified":True,"source_admitted":False,"required_original_tests":["All unchanged current-runtime preservation and prior stack drift/callback tests","Original aggregate source and full composition gates"]}
